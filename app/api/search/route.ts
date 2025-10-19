// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Conversation, Message, Contact } from '@/lib/types';

export const dynamic = 'force-dynamic';

export interface SearchResult {
    type: 'conversation' | 'message' | 'contact';
    title: string;
    content?: string;
    url: string;
    id: string;
    parentTitle?: string;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchTerm = `%${query}%`;

        const conversationsPromise = db.query<Conversation>(
            `SELECT id, title FROM conversations WHERE title ILIKE $1 LIMIT 10`,
            [searchTerm]
        );

        const messagesPromise = db.query<Message & { conversation_title: string }>(
            `SELECT m.id, m.content, m."conversationId", c.title as conversation_title 
             FROM messages m
             JOIN conversations c ON m."conversationId" = c.id
             WHERE m.content ILIKE $1 
             ORDER BY m."createdAt" DESC
             LIMIT 10`,
            [searchTerm]
        );

        const contactsPromise = db.query<Contact>(
            `SELECT id, name, email FROM contacts WHERE name ILIKE $1 OR email ILIKE $1 LIMIT 10`,
            [searchTerm]
        );

        const [convResult, msgResult, contactResult] = await Promise.all([
            conversationsPromise,
            messagesPromise,
            contactsPromise,
        ]);

        const results: SearchResult[] = [];

        convResult.rows.forEach(c => results.push({
            type: 'conversation',
            id: c.id,
            title: c.title,
            url: `/conversation/${c.id}`
        }));

        msgResult.rows.forEach(m => results.push({
            type: 'message',
            id: m.id,
            title: m.content.substring(0, 100) + '...',
            content: m.content,
            parentTitle: `in "${m.conversation_title}"`,
            url: `/conversation/${m.conversationId}#message-${m.id}`
        }));

        contactResult.rows.forEach(c => results.push({
            type: 'contact',
            id: c.id,
            title: c.name,
            content: c.email,
            url: `/contacts` // Assuming contacts hub can handle this
        }));
        
        return NextResponse.json({ results });

    } catch (error) {
        console.error('Global search failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
