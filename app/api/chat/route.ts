
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';

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

        const { rows: settingsRows } = await sql`SELECT value FROM settings WHERE key = 'featureFlags'`;
        const featureFlags = settingsRows[0]?.value || {
            enableProactiveSuggestions: true,
            enableMemoryExtraction: true,
        };

        const userQuery = messages[messages.length - 1].content;

        // 1. READ PATH: Context Assembly
        const pipeline = new ContextAssemblyPipeline();
        // Updated pipeline to return metadata for the monitor
        const { llmResponse, llmResponseTime, metadata } = await pipeline.run({
            conversation,
            userQuery,
            mentionedContacts: mentionedContacts || [],
            userMessageId,
            config: { episodicMemoryDepth: 12, semanticMemoryTopK: 5 },
        });

        const episodicMemory = new EpisodicMemoryModule();
        const savedAiMessage = await episodicMemory.store({
            conversationId: conversation.id,
            message: {
                role: 'model',
                content: llmResponse,
                tokenCount: Math.ceil(llmResponse.length / 4),
                responseTime: llmResponseTime,
                lastUpdatedAt: new Date(),
            },
        });

        // 2. BACKGROUND WRITE PATH
        if (featureFlags.enableMemoryExtraction) {
            const extractionPipeline = new MemoryExtractionPipeline();
            extractionPipeline.run({
                text: `User: ${userQuery}\nAI: ${llmResponse}`,
                messageId: savedAiMessage.id,
                conversationId: conversation.id,
                brainId: conversation.brainId || null,
                config: {}
            }).catch(e => console.error("Auto-extraction failed:", e));
        }

        let suggestion = null;
        if (featureFlags.enableProactiveSuggestions && llmResponse) {
             const historyForSuggestion = messages.slice(-1).map(m => ({role: m.role, parts: [{text: m.content}]}));
             historyForSuggestion.push({role: 'model', parts: [{text: llmResponse}]});
            suggestion = await generateProactiveSuggestion(historyForSuggestion);
        }
        
        return NextResponse.json({ 
            response: llmResponse, 
            suggestion,
            // Return metadata for live monitoring
            monitorMetadata: metadata 
        });

    } catch (error) {
        console.error('Error in chat API route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
