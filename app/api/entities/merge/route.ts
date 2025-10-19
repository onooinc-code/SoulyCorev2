import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import type { EntityDefinition } from '@/lib/types';
import { EntityVectorMemoryModule } from '@/core/memory/modules/entity_vector';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { targetId, sourceId } = await req.json();

    if (!targetId || !sourceId) {
        return NextResponse.json({ error: 'targetId and sourceId are required' }, { status: 400 });
    }
    if (targetId === sourceId) {
        return NextResponse.json({ error: 'Cannot merge an entity with itself' }, { status: 400 });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch both entities to get their data
        const { rows: entities } = await client.query<EntityDefinition>(`
            SELECT * FROM entity_definitions WHERE id = ANY($1::uuid[])
        `, [[targetId, sourceId]]);

        const targetEntity = entities.find(e => e.id === targetId);
        const sourceEntity = entities.find(e => e.id === sourceId);

        if (!targetEntity || !sourceEntity) {
            throw new Error('One or both entities not found.');
        }

        // 2. Merge aliases and update target entity
        const newAliases = [...new Set([
            ...(Array.isArray(targetEntity.aliases) ? targetEntity.aliases : []),
            ...(Array.isArray(sourceEntity.aliases) ? sourceEntity.aliases : []),
            sourceEntity.name // Add the source's canonical name as an alias
        ])];

        await client.query(`
            UPDATE entity_definitions SET aliases = $1, "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = $2
        `, [JSON.stringify(newAliases), targetId]);

        // 3. Re-point relationships
        await client.query(`UPDATE entity_relationships SET source_entity_id = $1 WHERE source_entity_id = $2`, [targetId, sourceId]);
        await client.query(`UPDATE entity_relationships SET target_entity_id = $1 WHERE target_entity_id = $2`, [targetId, sourceId]);

        // 4. Clean up any potential self-referencing loops created by the merge
        await client.query(`DELETE FROM entity_relationships WHERE source_entity_id = target_entity_id`);

        // 5. Handle message_entities associations
        // First, delete any source links that would conflict with existing target links
        await client.query(`
            DELETE FROM message_entities 
            WHERE entity_id = $1 
            AND message_id IN (SELECT message_id FROM message_entities WHERE entity_id = $2)
        `, [sourceId, targetId]);

        // Then, update the remaining source links to point to the target
        await client.query(`UPDATE message_entities SET entity_id = $1 WHERE entity_id = $2`, [targetId, sourceId]);
        
        // 6. Finally, delete the source entity. CASCADE will NOT be used as we've moved links.
        await client.query(`DELETE FROM entity_definitions WHERE id = $1`, [sourceId]);

        await client.query('COMMIT');

        // 7. After the transaction, delete the vector from Upstash (fire-and-forget is acceptable here)
        const vectorMemory = new EntityVectorMemoryModule();
        vectorMemory.delete(sourceId).catch(err => {
            console.error(`Failed to delete vector for merged entity ${sourceId}:`, err);
            // Optionally log this failure to a separate monitoring system
        });
        
        return NextResponse.json({ success: true, message: 'Entities merged successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to merge entities:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    } finally {
        client.release();
    }
}