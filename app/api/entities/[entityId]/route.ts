

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Entity } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;
        const { name, type, details_json } = await req.json();
        if (!name || !type || !details_json) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { rows } = await sql<Entity>`
            UPDATE entities
            SET name = ${name}, type = ${type}, details_json = ${details_json}
            WHERE id = ${entityId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update entity ${params.entityId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;
        const { rowCount } = await sql`DELETE FROM entities WHERE id = ${entityId};`;
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
