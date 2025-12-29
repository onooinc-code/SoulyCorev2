
import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact, AppSettings, ExtractionStrategy } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction'; // Need this for background
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';
import { StructuredMemoryModule } from '@/core/memory/modules/structured';
import { ProfileMemoryModule } from '@/core/memory/modules/profile';
import { EntityVectorMemoryModule } from '@/core/memory/modules/entity_vector';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function logSystem(message: string, payload?: any, level: 'info'|'warn'|'error' = 'info') {
    try {
        await sql`INSERT INTO logs (message, payload, level, timestamp) VALUES (${message}, ${JSON.stringify(payload)}, ${level}, NOW())`;
    } catch(e) { console.error("SysLog failed:", e); }
}

async function getExtractionConfig(conversation: Conversation): Promise<{ strategy: ExtractionStrategy, model: string }> {
    // 1. Check conversation overrides
    const convoSettings = conversation.uiSettings || {};
    if (convoSettings.extractionStrategy && convoSettings.extractionStrategy !== 'default') {
        return {
            strategy: convoSettings.extractionStrategy,
            model: convoSettings.extractionModel && convoSettings.extractionModel !== 'default' 
                ? convoSettings.extractionModel 
                : 'gemini-2.5-flash' // Fallback if strat is background but model not set
        };
    }

    // 2. Check Global Settings
    try {
        const { rows } = await sql`SELECT value FROM settings WHERE key = 'app_settings'`;
        if (rows.length > 0) {
            const settings = rows[0].value as AppSettings;
            if (settings.memoryConfig) {
                return {
                    strategy: settings.memoryConfig.extractionStrategy,
                    model: settings.memoryConfig.extractionModel || 'gemini-2.5-flash'
                };
            }
        }
    } catch (e) { console.warn("Failed to fetch global settings, using defaults."); }

    // 3. Default
    return { strategy: 'single-shot', model: 'gemini-2.5-flash' };
}

export async function POST(req: NextRequest) {
    try {
        const hasKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!hasKey) return NextResponse.json({ error: 'Missing AI API Key' }, { status: 500 });

        const body = await req.json();
        const { messages, conversation, mentionedContacts, userMessageId } = body;
        const userQuery = messages[messages.length - 1].content;

        // --- DETERMINE STRATEGY ---
        const config = await getExtractionConfig(conversation);
        const executionMode = config.strategy === 'single-shot' ? 'dual_output' : 'response_only';
        
        await logSystem(`[Chat] Processing with strategy: ${config.strategy}`, { mode: executionMode, model: config.model });

        // 1. RUN CONTEXT ASSEMBLY (Shared)
        const pipeline = new ContextAssemblyPipeline();
        const assemblyResult = await pipeline.run({
            conversation,
            userQuery,
            mentionedContacts: mentionedContacts || [],
            userMessageId,
            config: { episodicMemoryDepth: 10, semanticMemoryTopK: 3 },
            executionMode: executionMode // Pass the mode down
        });

        const { llmResponse, extractedMemory, llmResponseTime } = assemblyResult;

        // 2. SAVE AI RESPONSE
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

        // 3A. SINGLE-SHOT: PROCESS MEMORY IMMEDIATELY
        if (config.strategy === 'single-shot' && extractedMemory) {
             await processExtractedData(extractedMemory, conversation.id, conversation.brainId || null, savedAiMessage.id);
        }

        // 3B. BACKGROUND: TRIGGER SEPARATE EXTRACTION
        if (config.strategy === 'background') {
            // Fire-and-forget background processing
            // We reconstruct the text context: User Query + AI Response
            const contextText = `User: ${userQuery}\nAI: ${llmResponse}`;
            
            // Note: We use the existing MemoryExtractionPipeline class but invoke it manually here
            // to ensure we use the configured model, not just a default.
            // Since Vercel serverless functions can't spawn persistent threads, we simulate async 
            // by not awaiting this promise in the main response flow (or use Next.js after() if available/stable).
            // For stability in this environment, we'll just catch errors so it doesn't block the response.
            
            (async () => {
                try {
                     const extractor = new MemoryExtractionPipeline();
                     // We might need to implement a way to override the model in the pipeline or constructor
                     // For now, let's assume the pipeline uses a sensible default or updated logic.
                     // Ideally, MemoryExtractionPipeline should accept a config override.
                     await extractor.run({
                         text: contextText,
                         messageId: savedAiMessage.id,
                         conversationId: conversation.id,
                         brainId: conversation.brainId || null,
                         config: { modelOverride: config.model } // Pass model preference
                     });
                     await logSystem(`[Background] Extraction started`, { messageId: savedAiMessage.id });
                } catch (e) {
                     console.error("Background extraction failed:", e);
                }
            })();
        }

        return NextResponse.json({ 
            response: llmResponse, 
            suggestion: null, 
            monitorMetadata: assemblyResult.metadata 
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: { message: (error as Error).message }
        }, { status: 500 });
    }
}

// Helper to save extracted data (used in Single-Shot path)
async function processExtractedData(extractedMemory: any, conversationId: string, brainId: string | null, sourceMessageId: string) {
    const { entities, facts, userProfileUpdates } = extractedMemory;

    // Store Profile Updates
    if (userProfileUpdates) {
        const profileMem = new ProfileMemoryModule();
        await profileMem.store(userProfileUpdates);
    }

    // Store Facts (Semantic)
    if (facts && facts.length > 0) {
        const semanticMem = new SemanticMemoryModule();
        for (const fact of facts) {
            await semanticMem.store({ 
                text: fact, 
                metadata: { conversationId, type: 'fact', sourceMessageId } 
            });
        }
    }

    // Store Entities (Structured + Vector)
    if (entities && entities.length > 0) {
        const structuredMem = new StructuredMemoryModule();
        const vectorMem = new EntityVectorMemoryModule();
        
        for (const entity of entities) {
            const savedEntity = await structuredMem.store({ 
                type: 'entity', 
                data: { ...entity, brainId } 
            });
            
            if (savedEntity?.id) {
                await vectorMem.store({
                    id: savedEntity.id,
                    text: `${savedEntity.name}: ${savedEntity.description}`,
                    metadata: { brainId }
                });
            }
        }
    }
    
    await logSystem('[Memory] Single-Shot Data Processed', { 
        entities: entities?.length || 0, 
        facts: facts?.length || 0 
    });
}
