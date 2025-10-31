// app/api/projects/[projectId]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ProjectTask } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all tasks for a project
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const { rows } = await sql<ProjectTask>`
            SELECT * FROM project_tasks 
            WHERE "projectId" = ${projectId} 
            ORDER BY "status" ASC, "orderIndex" ASC, "createdAt" ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new task to a project
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const { title, description } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const { rows } = await sql<ProjectTask>`
            INSERT INTO project_tasks ("projectId", title, description)
            VALUES (${projectId}, ${title}, ${description || null})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}