
import { NextRequest, NextResponse } from 'next/server';
import { regenerateUserPrompt } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
    try {
        const { promptToRewrite, history } = await req.json();

        if (!promptToRewrite || !history) {
            return NextResponse.json({ error: 'Missing promptToRewrite or history' }, { status: 400 });
        }

        const rewrittenPrompt = await regenerateUserPrompt(promptToRewrite, history);

        if (!rewrittenPrompt) {
            return NextResponse.json({ error: 'Failed to regenerate prompt from AI model' }, { status: 500 });
        }

        return NextResponse.json({ rewrittenPrompt });

    } catch (error) {
        console.error('Error in regenerate prompt API:', error);
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}