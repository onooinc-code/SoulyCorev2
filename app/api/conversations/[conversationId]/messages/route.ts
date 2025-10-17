
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Message } from '@/lib/types';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';

export const dynamic = 'force-dynamic';

// GET all messages for a conversation
export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { rows } = await sql<Message>`
            SELECT * FROM messages 
            WHERE "conversationId" = ${conversationId} 
            ORDER BY "createdAt" ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new message to a conversation
export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { message } = await req.json();

        // Use the V2 Core module for storing the message
        const episodicMemory = new EpisodicMemoryModule();

        const messageData: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
            role: message.role,
            content: message.content,
            tokenCount: message.tokenCount,
            responseTime: message.responseTime,
            isBookmarked: message.isBookmarked,
            parentMessageId: message.parentMessageId,
            tags: message.tags,
        };
        
        const savedMessage = await episodicMemory.store({
            conversationId: conversationId,
            message: messageData
        });
        
        return NextResponse.json(savedMessage, { status: 201 });
    } catch (error) {
        console.error('Failed to create message:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: { message: (error as Error).message } }, { status: 500 });
    }
}