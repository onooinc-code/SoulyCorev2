

import { NextRequest, NextResponse } from 'next/server';
import { sql, db } from '@/lib/db';
// FIX: Corrected import path for type.
import type { EntityDefinition, EntityHistoryLog } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { entityId: string } }) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const { entityId } = params;
        const { name, type, description, aliases, tags } = await req.json();

        if (!name || !type) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Missing required fields: name and type' }, { status: 400 });
        }

        // 1. Get old entity state before updating
        const { rows: oldEntityRows } = await client.query<EntityDefinition>(
            `SELECT * FROM entity_definitions WHERE id = $1 FOR UPDATE`,
            [entityId]
        );

        if (oldEntityRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }
        const oldEntity = oldEntityRows[0];

        // 2. Update the entity
        const { rows: updatedRows } = await client.query<EntityDefinition>(
            `UPDATE entity_definitions
            SET 
                name = $1, 
                type = $2, 
                description = $3, 
                aliases = $4,
                tags = $5,
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *;`,
            [name, type, description || null, aliases ? JSON.stringify(aliases) : '[]', tags ? (tags as any) : null, entityId]
        );
        const updatedEntity = updatedRows[0];
        
        // 3. Compare old and new state and log changes to history
        const changes: Partial<EntityHistoryLog>[] = [];
        
        if (oldEntity.name !== updatedEntity.name) {
            changes.push({ fieldName: 'name', oldValue: oldEntity.name, newValue: updatedEntity.name });
        }
        if (oldEntity.type !== updatedEntity.type) {
            changes.push({ fieldName: 'type', oldValue: oldEntity.type, newValue: updatedEntity.type });
        }
        if (oldEntity.description !== updatedEntity.description) {
            changes.push({ fieldName: 'description', oldValue: oldEntity.description, newValue: updatedEntity.description });
        }
        if (JSON.stringify(oldEntity.aliases || []) !== JSON.stringify(updatedEntity.aliases || [])) {
            changes.push({ fieldName: 'aliases', oldValue: JSON.stringify(oldEntity.aliases || []), newValue: JSON.stringify(updatedEntity.aliases || []) });
        }
        if (JSON.stringify(oldEntity.tags || []) !== JSON.stringify(updatedEntity.tags || [])) {
            changes.push({ fieldName: 'tags', oldValue: JSON.stringify(oldEntity.tags || []), newValue: JSON.stringify(updatedEntity.tags || []) });
        }

        for (const change of changes) {
            await client.query(
                `INSERT INTO entity_history ("entityId", "fieldName", "oldValue", "newValue")
                 VALUES ($1, $2, $3, $4)`,
                 [entityId, change.fieldName, change.oldValue, change.newValue]
            );
        }

        await client.query('COMMIT');
        
        return NextResponse.json(updatedEntity);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to update entity ${params.entityId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;
        const { rowCount } = await sql`DELETE FROM entity_definitions WHERE id = ${entityId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Entity deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete entity ${params.entityId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}