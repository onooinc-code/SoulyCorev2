
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Tool } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all tools
export async function GET() {
    try {
        // FIX: Use "schemaJson" (quoted) to match the case-sensitive column name in the DB schema.
        const { rows } = await sql<Tool>`
            SELECT id, name, description, "schemaJson", "createdAt", "lastUpdatedAt" 
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
            parsedSchema = typeof schema_json === 'string' ? JSON.parse(schema_json) : schema_json;
        } catch (e) {
            return NextResponse.json({ error: 'schema_json must be valid JSON.' }, { status: 400 });
        }

        // FIX: Use "schemaJson" (quoted) for insertion as well.
        const { rows } = await sql<Tool>`
            INSERT INTO tools (name, description, "schemaJson", "lastUpdatedAt")
            VALUES (${name}, ${description}, ${JSON.stringify(parsedSchema)}, CURRENT_TIMESTAMP)
            RETURNING id, name, description, "schemaJson", "createdAt", "lastUpdatedAt";
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
