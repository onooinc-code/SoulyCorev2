
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import type { EntityDefinition } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<EntityDefinition>`SELECT * FROM entity_definitions ORDER BY "createdAt" DESC;`;
        return NextResponse.json({ entities: rows });
    } catch (error) {
        console.error('Failed to fetch entities:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, type, description, aliases } = await req.json();
        if (!name || !type) {
            return NextResponse.json({ error: 'Missing required fields: name and type' }, { status: 400 });
        }
        const { rows } = await sql<EntityDefinition>`
            INSERT INTO entity_definitions (name, type, description, aliases)
            VALUES (${name}, ${type}, ${description || null}, ${aliases ? JSON.stringify(aliases) : '[]'})
            ON CONFLICT (name, type) DO UPDATE SET 
                description = EXCLUDED.description, 
                aliases = EXCLUDED.aliases,
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create entity:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}