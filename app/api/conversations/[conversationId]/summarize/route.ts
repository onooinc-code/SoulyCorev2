import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateConversationSummary } from '@/lib/gemini-server';
import type { Message, Conversation } from '@/lib/types';
import { Content } from '@google/genai';

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;

        // 1. Fetch all messages for the conversation
        const { rows: messages } = await sql<Message>`
            SELECT role, content FROM messages
            WHERE "conversationId" = ${conversationId}
            ORDER BY "createdAt" ASC;
        `;

        if (messages.length === 0) {
            return NextResponse.json({ message: 'Conversation is empty, nothing to summarize.' });
        }

        // 2. Format for Gemini API
        const history: Content[] = messages.map(msg => ({
            role: msg.role as 'user' | 'model',
            parts: [{ text: msg.content }]
        }));

        // 3. Generate summary
        const summary = await generateConversationSummary(history);

        if (!summary) {
            throw new Error('AI failed to generate a summary.');
        }

        // 4. Update conversation summary in DB
        const { rows: updatedRows } = await sql<Conversation>`
            UPDATE conversations
            SET summary = ${summary}, "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${conversationId}
            RETURNING id, summary;
        `;

        return NextResponse.json(updatedRows[0]);

    } catch (error) {
        console.error(`Background summarization failed for conversation ${params.conversationId}:`, error);
        // Return 200 OK because this is a non-critical background task
        return NextResponse.json({ success: false, error: (error as Error).message });
    }
}