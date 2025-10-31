import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Task } from '@/lib/types';

export const dynamic = 'force-dynamic';

// PUT (update) a task
export async function PUT(req: NextRequest, { params }: { params: { taskId: string } }) {
    try {
        const { taskId } = params;
        const { title, description, dueDate, status } = await req.json();

        const { rows: existingRows } = await sql<Task>`SELECT * FROM tasks WHERE id = ${taskId}`;
        if (existingRows.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        const existingTask = existingRows[0];

        const { rows } = await sql<Task>`
            UPDATE tasks
            SET 
                title = ${title !== undefined ? title : existingTask.title}, 
                description = ${description !== undefined ? description : existingTask.description}, 
                "dueDate" = ${dueDate !== undefined ? dueDate : existingTask.dueDate}, 
                status = ${status !== undefined ? status : existingTask.status},
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
            DELETE FROM tasks WHERE id = ${taskId};
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