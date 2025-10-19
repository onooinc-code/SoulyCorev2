// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Project } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all projects
export async function GET() {
    try {
        const { rows } = await sql<Project>`
            SELECT * FROM projects ORDER BY "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new project
export async function POST(req: NextRequest) {
    try {
        const { name, description, due_date } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { rows } = await sql<Project>`
            INSERT INTO projects (name, description, due_date)
            VALUES (${name}, ${description || null}, ${due_date || null})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create project:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}