// app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectTask } from '@/lib/types';

// PUT (update) a task
export async function PUT(req: NextRequest, { params }: { params: { taskId: string } }) {
    try {
        const { taskId } = params;
        const { title, description, status, order_index } = await req.json();
        
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
        if (status !== undefined) {
            updates.push(`status = $${queryIndex++}`);
            values.push(status);
        }
         if (order_index !== undefined) {
            updates.push(`order_index = $${queryIndex++}`);
            values.push(order_index);
        }
        
        updates.push(`"lastUpdatedAt" = CURRENT_TIMESTAMP`);

        if (updates.length === 1) { // Only the timestamp was added
             return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(taskId);
        const queryString = `UPDATE project_tasks SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *;`;

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
        
        // This now targets the project_tasks table
        const { rowCount } = await db.query(`DELETE FROM project_tasks WHERE id = $1;`, [taskId]);

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete task ${params.taskId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}