
import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { sql } from '@/lib/db';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';
import { LinkPredictionPipeline } from '@/core/pipelines/link_prediction';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { messages, conversation, mentionedContacts, userMessageId, isAgentEnabled, isLinkPredictionEnabled } = (await req.json()) as {
            messages: Message[];
            conversation: Conversation;
            mentionedContacts?: Contact[];
            userMessageId: string;
            isAgentEnabled?: boolean;
            isLinkPredictionEnabled?: boolean;
        };

        if (!messages || messages.length === 0 || !conversation) {
            return NextResponse.json({ error: 'Missing messages or conversation data' }, { status: 400 });
        }

        const userQuery = messages[messages.length - 1].content;

        // 1. READ PATH: Context Assembly
        const pipeline = new ContextAssemblyPipeline();
        
        // If Agent is enabled, we might want to inject reasoning instructions
        const systemOverride = isAgentEnabled 
            ? "You are in ReAct Mode. Think step-by-step. Choose tools carefully." 
            : conversation.systemPrompt;

        const { llmResponse, llmResponseTime, metadata } = await pipeline.run({
            conversation: { ...conversation, systemPrompt: systemOverride },
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

        if (!savedAiMessage) {
            console.error("Critical: Failed to save AI response to episodic memory.");
        }

        // 2. Proactive Link Prediction
        let linkProposal = null;
        if (isLinkPredictionEnabled) {
            try {
                const linkPipeline = new LinkPredictionPipeline();
                linkProposal = await linkPipeline.run({ conversationId: conversation.id, brainId: conversation.brainId || null });
            } catch (lpError) {
                console.warn("Link prediction failed (non-critical):", lpError);
            }
        }

        // 3. BACKGROUND WRITE PATH
        if (savedAiMessage) {
            const extractionPipeline = new MemoryExtractionPipeline();
            extractionPipeline.run({
                text: `User: ${userQuery}\nAI: ${llmResponse}`,
                messageId: savedAiMessage.id,
                conversationId: conversation.id,
                brainId: conversation.brainId || null,
                config: {}
            }).catch(e => console.error("Auto-extraction failed (background):", e));
        }

        const historyForSuggestion = messages.slice(-1).map(m => ({role: m.role, parts: [{text: m.content}]}));
        historyForSuggestion.push({role: 'model', parts: [{text: llmResponse}]});
        const suggestion = await generateProactiveSuggestion(historyForSuggestion);
        
        return NextResponse.json({ 
            response: llmResponse, 
            suggestion,
            linkProposal,
            monitorMetadata: metadata 
        });

    } catch (error) {
        console.error('CRITICAL ERROR in chat API route:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: (error as Error).message 
        }, { status: 500 });
    }
}
