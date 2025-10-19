import { NextRequest, NextResponse } from 'next/server';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { textToAnalyze, aiMessageId, conversationId } = await req.json();

        if (!textToAnalyze || !aiMessageId || !conversationId) {
            return NextResponse.json({ error: 'textToAnalyze, aiMessageId, and conversationId are required' }, { status: 400 });
        }

        // Run the pipeline in the background (fire-and-forget)
        const pipeline = new MemoryExtractionPipeline();
        pipeline.run({
            text: textToAnalyze,
            messageId: aiMessageId,
            conversationId: conversationId,
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