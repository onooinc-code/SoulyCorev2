

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Message } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all bookmarked messages
export async function GET() {
    try {
        const { rows } = await sql<Message>`
            SELECT * FROM messages 
            WHERE "isBookmarked" = true 
            ORDER BY "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch bookmarked messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
