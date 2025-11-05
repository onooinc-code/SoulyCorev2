import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { PredicateDefinition } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { predicateId: string } }) {
    try {
        const { predicateId } = params;
        const { name, description, isTransitive, isSymmetric } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
        }
        const { rows } = await sql<PredicateDefinition>`
            UPDATE predicate_definitions
            SET name = ${name}, 
                description = ${description || null},
                "isTransitive" = ${isTransitive || false},
                "isSymmetric" = ${isSymmetric || false}
            WHERE id = ${predicateId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Predicate not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update predicate ${params.predicateId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { predicateId: string } }) {
    try {
        const { predicateId } = params;
        const { rowCount } = await sql`DELETE FROM predicate_definitions WHERE id = ${predicateId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Predicate not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Predicate deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete predicate ${params.predicateId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}