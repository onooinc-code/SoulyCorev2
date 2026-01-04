
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Tool } from '@/lib/types';

// PUT (update) a tool
export async function PUT(req: NextRequest, { params }: { params: { toolId: string } }) {
    try {
        const { toolId } = params;
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

        // FIX: Use "schemaJson" for update query.
        const { rows } = await sql<Tool>`
            UPDATE tools
            SET 
                name = ${name}, 
                description = ${description}, 
                "schemaJson" = ${JSON.stringify(parsedSchema)},
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${toolId}
            RETURNING id, name, description, "schemaJson", "createdAt", "lastUpdatedAt";
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update tool ${params.toolId}:`, error);
        if ((error as any).code === '23505') { // unique_violation for name
             return NextResponse.json({ error: 'A tool with this name already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE a tool
export async function DELETE(req: NextRequest, { params }: { params: { toolId: string } }) {
    try {
        const { toolId } = params;
        
        const { rowCount } = await sql`
            DELETE FROM tools WHERE id = ${toolId};
        `;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Tool deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete tool ${params.toolId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
