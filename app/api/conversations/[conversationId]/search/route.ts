import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Message } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const tagsParam = searchParams.get('tags');
        const tags = tagsParam ? tagsParam.split(',') : [];

        let searchConditions = 'WHERE "conversationId" = $1';
        const queryValues: any[] = [conversationId];
        let valueIndex = 2;

        if (query) {
            searchConditions += ` AND content ILIKE $${valueIndex++}`;
            queryValues.push(`%${query}%`);
        }
        if (tags.length > 0) {
            searchConditions += ` AND tags @> $${valueIndex++}::text[]`;
            queryValues.push(tags);
        }

        const messagesQuery = `SELECT * FROM messages ${searchConditions} ORDER BY "createdAt" DESC LIMIT 50;`;
        const messagesPromise = db.query(messagesQuery, queryValues);
        
        const tagsQuery = `SELECT DISTINCT unnest(tags) as tag FROM messages WHERE "conversationId" = $1 AND tags IS NOT NULL;`;
        const tagsPromise = db.query(tagsQuery, [conversationId]);
        
        const [messagesResult, tagsResult] = await Promise.all([messagesPromise, tagsPromise]);
        
        const availableTags = tagsResult.rows.map(row => row.tag);

        return NextResponse.json({
            messages: messagesResult.rows as Message[],
            availableTags: availableTags,
        });
        
    } catch (error) {
        console.error('Failed to search messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
