
import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';
import { LinkPredictionPipeline } from '@/core/pipelines/link_prediction';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function logSystem(message: string, payload?: any, level: 'info'|'warn'|'error' = 'info') {
    try {
        await sql`INSERT INTO logs (message, payload, level, timestamp) VALUES (${message}, ${JSON.stringify(payload)}, ${level}, NOW())`;
    } catch(e) { console.error("SysLog failed:", e); }
}

export async function POST(req: NextRequest) {
    try {
        // Basic environment check
        const hasKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!hasKey) {
            console.error("CRITICAL: API_KEY/GEMINI_API_KEY is missing.");
            return NextResponse.json({ error: 'System Configuration Error: Missing AI API Key' }, { status: 500 });
        }

        const body = await req.json();
        const { messages, conversation, mentionedContacts, userMessageId, isAgentEnabled, isLinkPredictionEnabled } = body;

        if (!messages || messages.length === 0 || !conversation) {
            return NextResponse.json({ error: 'Bad Request: Missing messages or conversation data' }, { status: 400 });
        }

        const userQuery = messages[messages.length - 1].content;
        await logSystem(`[Chat API] Received request`, { conversationId: conversation.id, userQueryLength: userQuery.length });

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
            await logSystem(`[Chat API] Context Assembly Failed`, { error: msg }, 'error');
            
            return NextResponse.json({ 
                error: `Cognitive Engine Failure: ${msg}`,
                details: { message: msg },
                stack: process.env.NODE_ENV === 'development' ? (assemblyError as Error).stack : undefined
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
        
        await logSystem(`[Chat API] Response sent successfully`, { responseTime: llmResponseTime });

        return NextResponse.json({ 
            response: llmResponse, 
            suggestion,
            linkProposal,
            monitorMetadata: metadata 
        });

    } catch (error) {
        console.error('UNHANDLED CRITICAL ERROR in chat API route:', error);
        await logSystem(`[Chat API] Critical Error`, { error: (error as Error).message }, 'error');
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: { message: (error as Error).message },
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        }, { status: 500 });
    }
}
