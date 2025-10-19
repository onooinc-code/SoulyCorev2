// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Task } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all tasks
export async function GET() {
    try {
        const { rows } = await sql<Task>`
            SELECT * FROM tasks ORDER BY status ASC, "due_date" ASC, "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new task
export async function POST(req: NextRequest) {
    try {
        const { title, description, due_date } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const { rows } = await sql<Task>`
            INSERT INTO tasks (title, description, due_date)
            VALUES (${title}, ${description || null}, ${due_date || null})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
