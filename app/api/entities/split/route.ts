import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { EntityDefinition, EntityRelationship } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { sourceEntityId, newEntities, relationshipMigrations } = await req.json();

    if (!sourceEntityId || !Array.isArray(newEntities) || newEntities.length < 2 || !Array.isArray(relationshipMigrations)) {
        return NextResponse.json({ error: 'Invalid request body for splitting entity.' }, { status: 400 });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Create the new entities and build a map of temporary ID to new UUID
        const newEntityMap = new Map<string, string>();
        for (const entity of newEntities) {
            const { rows } = await client.query<EntityDefinition>(
                `INSERT INTO entity_definitions (name, type, description, "brainId") VALUES ($1, $2, $3, (SELECT "brainId" FROM entity_definitions WHERE id = $4)) RETURNING id`,
                [entity.name, entity.type, entity.description, sourceEntityId]
            );
            newEntityMap.set(entity.id, rows[0].id);
        }

        // 2. Process relationship migrations
        for (const migration of relationshipMigrations) {
            if (migration.newOwnerEntityId === 'DELETE') {
                await client.query(`DELETE FROM entity_relationships WHERE id = $1`, [migration.relationshipId]);
            } else {
                const newOwnerUuid = newEntityMap.get(migration.newOwnerEntityId);
                if (newOwnerUuid) {
                    // Check if the relationship was pointing to or from the source entity and update accordingly
                    await client.query(`UPDATE entity_relationships SET "sourceEntityId" = $1 WHERE id = $2 AND "sourceEntityId" = $3`, [newOwnerUuid, migration.relationshipId, sourceEntityId]);
                    await client.query(`UPDATE entity_relationships SET "targetEntityId" = $1 WHERE id = $2 AND "targetEntityId" = $3`, [newOwnerUuid, migration.relationshipId, sourceEntityId]);
                }
            }
        }

        // 3. Delete the original source entity (this will cascade delete any un-migrated relationships)
        await client.query(`DELETE FROM entity_definitions WHERE id = $1`, [sourceEntityId]);

        await client.query('COMMIT');

        return NextResponse.json({ success: true, message: 'Entity split successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to split entity:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    } finally {
        client.release();
    }
}