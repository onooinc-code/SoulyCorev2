import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityDefinition } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brainId = searchParams.get('brainId');

        let rows;
        if (brainId && brainId !== 'all') {
            const result = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE "brainId" = ${brainId} ORDER BY "createdAt" DESC;`;
            rows = result.rows;
        } else if (brainId === 'all') {
             const result = await sql<EntityDefinition>`SELECT * FROM entity_definitions ORDER BY "createdAt" DESC;`;
             rows = result.rows;
        } else {
             // Default to no brain
             const result = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE "brainId" IS NULL ORDER BY "createdAt" DESC;`;
             rows = result.rows;
        }
        
        return NextResponse.json({ entities: rows });
    } catch (error) {
        console.error('Failed to fetch entities:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, type, description, aliases, tags, brainId } = await req.json();
        if (!name || !type) {
            return NextResponse.json({ error: 'Missing required fields: name and type' }, { status: 400 });
        }
        const { rows } = await sql<EntityDefinition>`
            INSERT INTO entity_definitions (name, type, description, aliases, tags, "brainId")
            VALUES (${name}, ${type}, ${description || null}, ${aliases ? JSON.stringify(aliases) : '[]'}, ${tags ? (tags as any) : null}, ${brainId || null})
            ON CONFLICT (name, type, "brainId") DO UPDATE SET 
                description = EXCLUDED.description, 
                aliases = EXCLUDED.aliases,
                tags = EXCLUDED.tags,
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