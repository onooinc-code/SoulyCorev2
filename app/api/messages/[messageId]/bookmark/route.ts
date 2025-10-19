
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Message } from '@/lib/types';

// PUT to toggle the bookmark status of a message
export async function PUT(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;
        
        // FIX: Use COALESCE to handle potential NULL values in the isBookmarked column,
        // ensuring the toggle works reliably even for older records created before the
        // column had a default value.
        const { rows } = await sql<Message>`
            UPDATE messages
            SET "isBookmarked" = NOT COALESCE("isBookmarked", false)
            WHERE id = ${messageId}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to toggle bookmark for message ${params.messageId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}