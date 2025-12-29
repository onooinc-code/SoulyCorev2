
import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';
import { LinkPredictionPipeline } from '@/core/pipelines/link_prediction';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // Basic environment check - Look for either variable
        const hasKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        
        if (!hasKey) {
            console.error("CRITICAL: API_KEY/GEMINI_API_KEY is missing from environment variables.");
            return NextResponse.json({ error: 'System Configuration Error: Missing AI API Key' }, { status: 500 });
        }

        const body = await req.json();
        const { messages, conversation, mentionedContacts, userMessageId, isAgentEnabled, isLinkPredictionEnabled } = body;

        if (!messages || messages.length === 0 || !conversation) {
            return NextResponse.json({ error: 'Bad Request: Missing messages or conversation data' }, { status: 400 });
        }

        const userQuery = messages[messages.length - 1].content;

        // 1. READ PATH: Context Assembly
        let assemblyResult;
        try {
            const pipeline = new ContextAssemblyPipeline();
            const systemOverride = isAgentEnabled 
                ? "You are in ReAct Mode. Think step-by-step. Choose tools carefully." 
                : conversation.systemPrompt;

            assemblyResult = await pipeline.run({
                conversation: { ...conversation, systemPrompt: systemOverride },
                userQuery,
                mentionedContacts: mentionedContacts || [],
                userMessageId,
                config: { episodicMemoryDepth: 12, semanticMemoryTopK: 5 },
            });
        } catch (assemblyError) {
            console.error("Context Assembly Pipeline failed:", assemblyError);
            const msg = (assemblyError as Error).message || "Unknown Pipeline Error";
            const stack = (assemblyError as Error).stack;
            
            // FIX: Return 'details' as an object with a 'message' property to match client expectation.
            return NextResponse.json({ 
                error: `Cognitive Engine Failure: ${msg}`,
                details: { message: msg },
                stack: process.env.NODE_ENV === 'development' ? stack : undefined
            }, { status: 500 });
        }

        const { llmResponse, llmResponseTime, metadata } = assemblyResult;

        // Save AI message defensively
        let savedAiMessage = null;
        try {
            const episodicMemory = new EpisodicMemoryModule();
            savedAiMessage = await episodicMemory.store({
                conversationId: conversation.id,
                message: {
                    role: 'model',
                    content: llmResponse,
                    tokenCount: Math.ceil(llmResponse.length / 4),
                    responseTime: llmResponseTime,
                    lastUpdatedAt: new Date(),
                },
            });
        } catch (dbError) {
            console.warn("Non-critical failure: Failed to save AI response to database history.", dbError);
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
            try {
                const extractionPipeline = new MemoryExtractionPipeline();
                extractionPipeline.run({
                    text: `User: ${userQuery}\nAI: ${llmResponse}`,
                    messageId: savedAiMessage.id,
                    conversationId: conversation.id,
                    brainId: conversation.brainId || null,
                    config: {}
                }).catch(e => console.error("Auto-extraction failed (background):", e));
            } catch (extractionTriggerError) {
                console.warn("Failed to trigger background memory extraction:", extractionTriggerError);
            }
        }

        // Suggestion generation
        let suggestion = null;
        try {
            const historyForSuggestion = messages.slice(-1).map((m: any) => ({role: m.role, parts: [{text: m.content}]}));
            historyForSuggestion.push({role: 'model', parts: [{text: llmResponse}]});
            suggestion = await generateProactiveSuggestion(historyForSuggestion);
        } catch (suggestionError) {
            console.warn("Suggestion generation failed:", suggestionError);
        }
        
        return NextResponse.json({ 
            response: llmResponse, 
            suggestion,
            linkProposal,
            monitorMetadata: metadata 
        });

    } catch (error) {
        console.error('UNHANDLED CRITICAL ERROR in chat API route:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: { message: (error as Error).message },
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        }, { status: 500 });
    }
}
