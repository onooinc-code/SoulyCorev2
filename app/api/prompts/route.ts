

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import { Prompt } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all prompts
export async function GET() {
    try {
        const { rows } = await sql<Prompt>`
            SELECT * FROM prompts ORDER BY name ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch prompts:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// POST a new prompt
export async function POST(req: NextRequest) {
    try {
        // FIX: Corrected property name from snake_case to camelCase to match type definition.
        const { name, content, folder, tags, type, chainDefinition } = await req.json() as Partial<Prompt>;

        if (!name || !content) {
            return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
        }

        const { rows } = await sql`
            INSERT INTO prompts (name, content, folder, tags, type, "chainDefinition")
            VALUES (
                ${name}, 
                ${content}, 
                ${folder}, 
                ${tags ? (tags as any) : null}, 
                ${type || 'single'}, 
                ${chainDefinition ? JSON.stringify(chainDefinition) : null}
            )
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0] as Prompt, { status: 201 });
    } catch (error) {
        console.error('Failed to create prompt:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}