
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Tool } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all tools
export async function GET() {
    try {
        const { rows } = await sql<Tool>`
            SELECT id, name, description, schema_json, "createdAt", "lastUpdatedAt" 
            FROM tools ORDER BY name ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch tools:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new tool
export async function POST(req: NextRequest) {
    try {
        const { name, description, schema_json } = await req.json();

        if (!name || !description || !schema_json) {
            return NextResponse.json({ error: 'Name, description, and schema_json are required' }, { status: 400 });
        }
        
        let parsedSchema;
        try {
            parsedSchema = JSON.parse(schema_json);
        } catch (e) {
            return NextResponse.json({ error: 'schema_json must be valid JSON.' }, { status: 400 });
        }

        const { rows } = await sql<Tool>`
            INSERT INTO tools (name, description, schema_json, "lastUpdatedAt")
            VALUES (${name}, ${description}, ${parsedSchema}, CURRENT_TIMESTAMP)
            RETURNING id, name, description, schema_json, "createdAt", "lastUpdatedAt";
        `;
        
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create tool:', error);
        if ((error as any).code === '23505') { // unique_violation for name
             return NextResponse.json({ error: 'A tool with this name already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
