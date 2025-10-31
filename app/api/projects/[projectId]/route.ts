// app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Project } from '@/lib/types';

// PUT (update) a project
export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const { name, description, status, dueDate } = await req.json();

        // In a real app, you'd build a dynamic query based on provided fields.
        // For simplicity, we'll update all editable fields.
        const { rows } = await sql<Project>`
            UPDATE projects
            SET 
                name = ${name}, 
                description = ${description}, 
                status = ${status}, 
                "dueDate" = ${dueDate},
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${projectId}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update project ${params.projectId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE a project
export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        
        const { rowCount } = await sql`
            DELETE FROM projects WHERE id = ${projectId};
        `;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete project ${params.projectId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}