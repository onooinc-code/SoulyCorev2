import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { summarizeForContext } from '@/lib/gemini-server';
import type { Message } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;

        // 1. Fetch the full message content
        const { rows } = await sql<Message>`
            SELECT content FROM messages WHERE id = ${messageId};
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        const contentToSummarize = rows[0].content;

        // 2. Generate the summary using the specialized function
        const summary = await summarizeForContext(contentToSummarize);

        if (!summary) {
            throw new Error('AI failed to generate a summary for context.');
        }

        // 3. Update the message record with the summary
        await sql`
            UPDATE messages
            SET content_summary = ${summary}
            WHERE id = ${messageId};
        `;

        return NextResponse.json({ success: true, messageId, summary });

    } catch (error) {
        console.error(`Background summarization failed for message ${params.messageId}:`, error);
        // We return a 200 OK even on failure because this is a background task
        // and we don't want the client to handle this as a critical error.
        // The error is logged on the server.
        return NextResponse.json({ success: false, error: (error as Error).message });
    }
}