import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Segment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<Segment>`SELECT * FROM segments ORDER BY name ASC;`;
        return NextResponse.json({ segments: rows });
    } catch (error) {
        console.error('Failed to fetch segments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, type, description } = await req.json();
        if (!name || !type) {
            return NextResponse.json({ error: 'Missing required fields: name and type' }, { status: 400 });
        }
        const { rows } = await sql<Segment>`
            INSERT INTO segments (name, type, description)
            VALUES (${name}, ${type}, ${description || null})
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description,
                type = EXCLUDED.type
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create segment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}