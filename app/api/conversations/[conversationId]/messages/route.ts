

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Message } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all messages for a conversation
export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { rows } = await sql<Message>`
            SELECT * FROM messages 
            WHERE "conversationId" = ${conversationId} 
            ORDER BY "createdAt" ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new message to a conversation
export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { message } = await req.json();

        // Also update the conversation's lastUpdatedAt timestamp
        await sql`UPDATE conversations SET "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = ${conversationId};`;
        
        const { rows } = await sql<Message>`
            INSERT INTO messages ("conversationId", role, content, "tokenCount", "responseTime", "isBookmarked")
            VALUES (${conversationId}, ${message.role}, ${message.content}, ${message.tokenCount}, ${message.responseTime}, ${message.isBookmarked})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0] as Message, { status: 201 });
    } catch (error) {
        console.error('Failed to create message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
