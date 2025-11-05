import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityRelationship } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { relationshipId: string } }) {
    try {
        const { relationshipId } = params;
        const { rowCount } = await sql`
            DELETE FROM entity_relationships WHERE id = ${relationshipId};
        `;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Relationship deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete relationship ${params.relationshipId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { relationshipId: string } }) {
     try {
        const { relationshipId } = params;
        const { predicateName } = await req.json();

        if (!predicateName) {
            return NextResponse.json({ error: 'predicateName is required' }, { status: 400 });
        }

        // Upsert predicate to get its ID
        const { rows: predicateRows } = await sql`
            INSERT INTO predicate_definitions (name) VALUES (${predicateName})
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id;
        `;
        const predicateId = predicateRows[0].id;

        const { rows } = await sql`
            UPDATE entity_relationships SET "predicateId" = ${predicateId} WHERE id = ${relationshipId} RETURNING *;
        `;
         if (rows.length === 0) {
            return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update relationship ${params.relationshipId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}