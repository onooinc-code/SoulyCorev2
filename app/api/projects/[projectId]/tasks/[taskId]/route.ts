// app/api/projects/[projectId]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ProjectTask } from '@/lib/types';

export const dynamic = 'force-dynamic';

// PUT (update) a task
export async function PUT(req: NextRequest, { params }: { params: { projectId: string, taskId: string } }) {
    try {
        const { taskId } = params;
        const body = await req.json();

        // Fetch existing task to merge undefined fields
        const { rows: existingRows } = await sql`SELECT * FROM project_tasks WHERE id = ${taskId}`;
        if (existingRows.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        const existingTask = existingRows[0];
        
        // FIX: Corrected property name from snake_case to camelCase.
        const { title, description, status, orderIndex } = body;

        const { rows } = await sql<ProjectTask>`
            UPDATE project_tasks
            SET 
                title = ${title !== undefined ? title : existingTask.title},
                description = ${description !== undefined ? description : existingTask.description},
                status = ${status !== undefined ? status : existingTask.status},
                "orderIndex" = ${orderIndex !== undefined ? orderIndex : existingTask.orderIndex},
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${taskId}
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update task ${params.taskId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE a task
export async function DELETE(req: NextRequest, { params }: { params: { taskId: string } }) {
    try {
        const { taskId } = params;
        
        const { rowCount } = await sql`
            DELETE FROM project_tasks WHERE id = ${taskId};
        `;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete task ${params.taskId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}