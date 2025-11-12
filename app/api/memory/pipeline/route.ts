import { NextRequest, NextResponse } from 'next/server';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';
import { sql } from '@/lib/db';
import type { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { textToAnalyze, aiMessageId, conversationId } = await req.json();

        if (!textToAnalyze || !aiMessageId || !conversationId) {
            return NextResponse.json({ error: 'textToAnalyze, aiMessageId, and conversationId are required' }, { status: 400 });
        }
        
        // Fetch conversation to get brainId
        const { rows: convoRows } = await sql<Conversation>`SELECT "brainId" FROM conversations WHERE id = ${conversationId}`;
        const brainId = convoRows.length > 0 ? (convoRows[0].brainId ?? null) : null;

        // Run the pipeline in the background (fire-and-forget)
        const pipeline = new MemoryExtractionPipeline();
        pipeline.run({
            text: textToAnalyze,
            messageId: aiMessageId,
            conversationId: conversationId,
            brainId: brainId,
            config: {
                enableEntityExtraction: true,
                enableKnowledgeExtraction: true,
                enableSegmentExtraction: true,
            }
        }).catch(err => {
            console.error("Background memory extraction failed:", err);
        });

        // Respond immediately
        return NextResponse.json({ success: true, message: 'Memory extraction process started.' }, { status: 202 });

    } catch (error) {
        console.error('Error in memory pipeline API route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}