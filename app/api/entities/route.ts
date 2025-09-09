

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Entity } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<Entity>`SELECT * FROM entities ORDER BY "createdAt" DESC;`;
        return NextResponse.json({ entities: rows });
    } catch (error) {
        console.error('Failed to fetch entities:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, type, details_json } = await req.json();
        if (!name || !type || !details_json) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { rows } = await sql<Entity>`
            INSERT INTO entities (name, type, details_json)
            VALUES (${name}, ${type}, ${details_json})
            ON CONFLICT (name, type) DO UPDATE SET details_json = EXCLUDED.details_json, "createdAt" = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create entity:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
