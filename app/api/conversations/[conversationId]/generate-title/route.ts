

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateTitleFromHistory } from '@/lib/gemini-server';
import { Content } from '@google/genai';
// FIX: Corrected import paths for types.
import { Message, Conversation } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;

        // 1. Fetch messages for the conversation
        const { rows: messages } = await sql<Message>`
            SELECT role, content FROM messages
            WHERE "conversationId" = ${conversationId}
            ORDER BY "createdAt" ASC;
        `;

        if (messages.length === 0) {
            return NextResponse.json({ error: 'Cannot generate title for an empty conversation' }, { status: 400 });
        }

        // 2. Format for Gemini API
        const history: Content[] = messages.map(msg => ({
            role: msg.role as 'user' | 'model',
            parts: [{ text: msg.content }]
        }));

        // 3. Generate title
        const newTitle = await generateTitleFromHistory(history);

        if (!newTitle) {
            throw new Error('AI failed to generate a title.');
        }

        // 4. Update conversation in DB
        const { rows: updatedRows } = await sql<Conversation>`
            UPDATE conversations
            SET title = ${newTitle}, "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${conversationId}
            RETURNING *;
        `;

        if (updatedRows.length === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRows[0]);

    } catch (error) {
        console.error(`Failed to generate title for conversation ${params.conversationId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}