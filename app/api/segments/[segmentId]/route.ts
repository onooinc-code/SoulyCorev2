import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Segment } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { segmentId: string } }) {
    try {
        const { segmentId } = params;
        const { name, type, description } = await req.json();
        if (!name || !type) {
            return NextResponse.json({ error: 'Missing required fields: name and type' }, { status: 400 });
        }
        const { rows } = await sql<Segment>`
            UPDATE segments
            SET name = ${name}, type = ${type}, description = ${description || null}
            WHERE id = ${segmentId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update segment ${params.segmentId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { segmentId: string } }) {
    try {
        const { segmentId } = params;
        const { rowCount } = await sql`DELETE FROM segments WHERE id = ${segmentId};`; // CASCADE should be set in DB schema
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Segment deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete segment ${params.segmentId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}