import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { messages, conversation, mentionedContacts, userMessageId } = (await req.json()) as {
            messages: Message[];
            conversation: Conversation;
            mentionedContacts?: Contact[];
            userMessageId: string;
        };

        if (!messages || messages.length === 0 || !conversation) {
            return NextResponse.json({ error: 'Missing messages or conversation data' }, { status: 400 });
        }

        // Fetch latest settings to determine if features are enabled
        const { rows: settingsRows } = await sql`SELECT value FROM settings WHERE key = 'featureFlags'`;
        const featureFlags = settingsRows[0]?.value || {
            enableProactiveSuggestions: true,
            enableMemoryExtraction: true,
        };

        const userQuery = messages[messages.length - 1].content;

        const pipeline = new ContextAssemblyPipeline();
        const { llmResponse, llmResponseTime } = await pipeline.run({
            conversation,
            userQuery,
            mentionedContacts: mentionedContacts || [],
            userMessageId,
            config: {
                episodicMemoryDepth: 10,
                semanticMemoryTopK: 5,
            },
        });

        const episodicMemory = new EpisodicMemoryModule();
        const aiMessageData = {
            role: 'model' as 'model',
            content: llmResponse,
            tokenCount: Math.ceil(llmResponse.length / 4),
            responseTime: llmResponseTime,
        };
        await episodicMemory.store({
            conversationId: conversation.id,
            message: aiMessageData,
        });

        let suggestion = null;
        if (featureFlags.enableProactiveSuggestions && llmResponse) {
             const historyForSuggestion = messages.slice(-2).map(m => ({role: m.role, parts: [{text: m.content}]}));
             if(historyForSuggestion.length === 1){
                historyForSuggestion.push({role: 'model', parts: [{text: llmResponse}]});
             }
            suggestion = await generateProactiveSuggestion(historyForSuggestion);
        }
        
        return NextResponse.json({ response: llmResponse, suggestion });

    } catch (error) {
        console.error('Error in chat API route:', error);
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
