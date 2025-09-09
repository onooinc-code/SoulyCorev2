

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Message } from '@/lib/types';

// PUT to update a message's content
export async function PUT(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;
        const { content } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Estimate new token count
        const tokenCount = Math.ceil(content.length / 4);
        
        const { rows } = await sql<Message>`
            UPDATE messages
            SET content = ${content}, "tokenCount" = ${tokenCount}
            WHERE id = ${messageId}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0] as Message);
    } catch (error) {
        console.error(`Failed to update message ${params.messageId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// DELETE a message
export async function DELETE(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;
        
        const { rowCount } = await sql`
            DELETE FROM messages
            WHERE id = ${messageId};
        `;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete message ${params.messageId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
