import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        // Delete all messages associated with the conversation
        const { rowCount } = await sql`
            DELETE FROM messages
            WHERE "conversationId" = ${conversationId};
        `;
        
        // Also update the conversation's lastUpdatedAt timestamp to reflect the change
        await sql`
            UPDATE conversations 
            SET "lastUpdatedAt" = CURRENT_TIMESTAMP 
            WHERE id = ${conversationId};
        `;

        return NextResponse.json({ success: true, message: `Cleared ${rowCount} messages.` });

    } catch (error) {
        console.error(`Failed to clear messages for conversation ${params.conversationId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}