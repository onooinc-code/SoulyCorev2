

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Prompt } from '@/lib/types';

// GET a single prompt by ID
export async function GET(req: NextRequest, { params }: { params: { promptId: string } }) {
    try {
        const { promptId } = params;
        const { rows } = await sql<Prompt>`SELECT * FROM prompts WHERE id = ${promptId};`;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0] as Prompt);
    } catch (error) {
        console.error(`Failed to fetch prompt ${params.promptId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}


// PUT (update) a prompt
export async function PUT(req: NextRequest, { params }: { params: { promptId: string } }) {
    try {
        const { promptId } = params;
        const { name, content, folder, tags, type, chain_definition } = await req.json() as Partial<Prompt>;

        if (!name || !content) {
            return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
        }

        const { rows } = await sql<Prompt>`
            UPDATE prompts
            SET 
                name = ${name}, 
                content = ${content}, 
                folder = ${folder}, 
                tags = ${tags ? (tags as any) : null},
                type = ${type || 'single'},
                chain_definition = ${chain_definition ? JSON.stringify(chain_definition) : null},
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${promptId}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0] as Prompt);
    } catch (error) {
        console.error(`Failed to update prompt ${params.promptId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// DELETE a prompt
export async function DELETE(req: NextRequest, { params }: { params: { promptId: string } }) {
    try {
        const { promptId } = params;
        
        const { rowCount } = await sql`
            DELETE FROM prompts WHERE id = ${promptId};
        `;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Prompt deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete prompt ${params.promptId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
