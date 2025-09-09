import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();
        if (!text) {
            return NextResponse.json({ error: 'Text is required for summarization' }, { status: 400 });
        }

        const summary = await generateSummary(text);

        if (!summary) {
            return NextResponse.json({ error: 'Failed to generate summary from the AI model' }, { status: 500 });
        }

        return NextResponse.json({ summary });

    } catch (error) {
        console.error('Error in summarize API:', error);
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
