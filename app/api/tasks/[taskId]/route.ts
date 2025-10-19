// app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { Task } from '@/lib/types';

// PUT (update) a task
export async function PUT(req: NextRequest, { params }: { params: { taskId: string } }) {
    try {
        const { taskId } = params;
        const { title, description, due_date, status } = await req.json();
        
        const updates: string[] = [];
        const values: any[] = [];
        let queryIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${queryIndex++}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${queryIndex++}`);
            values.push(description);
        }
        if (due_date !== undefined) {
            updates.push(`due_date = $${queryIndex++}`);
            values.push(due_date);
        }
        if (status !== undefined) {
            updates.push(`status = $${queryIndex++}`);
            values.push(status);
            if (status === 'completed') {
                updates.push(`"completed_at" = CURRENT_TIMESTAMP`);
            } else {
                updates.push(`"completed_at" = NULL`);
            }
        }
        
        updates.push(`"lastUpdatedAt" = CURRENT_TIMESTAMP`);

        if (updates.length === 1) {
             return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(taskId);
        const queryString = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *;`;

        const { rows } = await db.query(queryString, values);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        
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
        
        const { rowCount } = await sql`DELETE FROM tasks WHERE id = ${taskId};`;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete task ${params.taskId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
