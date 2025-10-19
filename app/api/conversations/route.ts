import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET() {
    try {
        const { rows } = await sql<Conversation>`
            SELECT * FROM conversations ORDER BY "lastUpdatedAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new conversation
export async function POST(req: NextRequest) {
    try {
        const { title } = await req.json();
        const { rows } = await sql<Conversation>`
            INSERT INTO conversations (title) VALUES (${title || 'New Chat'}) RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
