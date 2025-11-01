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

        const { rows: entities } = await client.query<EntityDefinition>(`
            SELECT * FROM entity_definitions WHERE id = ANY($1::uuid[])
        `, [[targetId, sourceId]]);

        const targetEntity = entities.find(e => e.id === targetId);
        const sourceEntity = entities.find(e => e.id === sourceId);

        if (!targetEntity || !sourceEntity) {
            throw new Error('One or both entities not found.');
        }

        // Merge aliases
        const newAliases = [...new Set([
            ...(Array.isArray(targetEntity.aliases) ? targetEntity.aliases : []),
            ...(Array.isArray(sourceEntity.aliases) ? sourceEntity.aliases : []),
            sourceEntity.name
        ])];

        await client.query(`
            UPDATE entity_definitions SET aliases = $1, "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = $2
        `, [JSON.stringify(newAliases), targetId]);

        // Re-point relationships (source)
        const { rows: sourceRels } = await client.query(`SELECT * FROM entity_relationships WHERE "sourceEntityId" = $1`, [sourceId]);
        for (const rel of sourceRels) {
            await client.query(`
                INSERT INTO entity_relationships ("sourceEntityId", "targetEntityId", predicate, context)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT ("sourceEntityId", "targetEntityId", predicate) DO NOTHING
            `, [targetId, rel.targetEntityId, rel.predicate, rel.context]);
        }

        // Re-point relationships (target)
        const { rows: targetRels } = await client.query(`SELECT * FROM entity_relationships WHERE "targetEntityId" = $1`, [sourceId]);
        for (const rel of targetRels) {
             await client.query(`
                INSERT INTO entity_relationships ("sourceEntityId", "targetEntityId", predicate, context)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT ("sourceEntityId", "targetEntityId", predicate) DO NOTHING
            `, [rel.sourceEntityId, targetId, rel.predicate, rel.context]);
        }
        
        // Associations with messages
        const { rows: messageEntities } = await client.query(`SELECT "messageId" FROM message_entities WHERE "entityId" = $1`, [sourceId]);
        for(const me of messageEntities) {
            await client.query(`
                INSERT INTO message_entities ("messageId", "entityId") VALUES ($1, $2) ON CONFLICT DO NOTHING
            `, [me.messageId, targetId]);
        }

        // Now, delete the old entity, which will cascade delete its direct relationships and message associations
        await client.query(`DELETE FROM entity_definitions WHERE id = $1`, [sourceId]);

        await client.query('COMMIT');

        // After the transaction, delete the vector from Upstash
        const vectorMemory = new EntityVectorMemoryModule();
        vectorMemory.delete(sourceId).catch(err => {
            console.error(`Failed to delete vector for merged entity ${sourceId}:`, err);
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