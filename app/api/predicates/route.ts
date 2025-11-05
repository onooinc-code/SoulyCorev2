import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { PredicateDefinition } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<PredicateDefinition>`SELECT * FROM predicate_definitions ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch predicates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
        }
        const { rows } = await sql<PredicateDefinition>`
            INSERT INTO predicate_definitions (name, description)
            VALUES (${name}, ${description || null})
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create predicate:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
