
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Message } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface MessageSearchResult extends Message {
    conversationTitle: string;
}

// GET messages by tag query
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json([]);
        }

        // Search for tags that start with the query term for autocomplete-style searching
        const likeQuery = `${query}%`;

        // This query finds messages where at least one of its tags matches the search query.
        // It also joins with the conversations table to get the title for context.
        const { rows } = await db.query<MessageSearchResult>(`
            SELECT m.*, c.title as "conversationTitle"
            FROM messages m
            JOIN conversations c ON m."conversationId" = c.id
            WHERE EXISTS (
                SELECT 1
                FROM unnest(m.tags) as t
                WHERE t ILIKE $1
            )
            ORDER BY m."createdAt" DESC
            LIMIT 10;
        `, [likeQuery]);
        
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to search messages by tag:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
