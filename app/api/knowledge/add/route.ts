import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-server';
import { getKnowledgeBaseIndex } from '@/lib/pinecone';
import { v4 as uuidv4 } from 'uuid';
import { sql } from '@/lib/db';

// Simple server-side logging
async function serverLog(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level});
        `;
    } catch (e) {
        console.error(`DB log failed: ${message}`, e);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { content } = await req.json();

        if (!content || typeof content !== 'string' || content.trim().length < 10) {
            return NextResponse.json({ error: 'Content must be a meaningful string.' }, { status: 400 });
        }
        
        await serverLog('Adding new knowledge snippet.', { contentLength: content.length });

        const embedding = await generateEmbedding(content);
        
        const vectorToUpsert = {
            id: uuidv4(),
            values: embedding,
            metadata: { text: content },
        };

        await getKnowledgeBaseIndex().upsert([vectorToUpsert]);

        await serverLog('Successfully upserted knowledge snippet to Pinecone.', { id: vectorToUpsert.id });

        return NextResponse.json({ success: true, message: 'Knowledge added successfully.', id: vectorToUpsert.id });

    } catch (error) {
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        console.error('Error in add knowledge API:', error);
        await serverLog('Critical error in add knowledge API.', { error: errorDetails }, 'error');
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}