
import { NextRequest, NextResponse } from 'next/server';
import { Conversation, Message, Contact } from '@/lib/types';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
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

export async function POST(req: NextRequest) {
    try {
        const hasKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!hasKey) return NextResponse.json({ error: 'Missing AI API Key' }, { status: 500 });

        const body = await req.json();
        const { messages, conversation, mentionedContacts, userMessageId } = body;

        const userQuery = messages[messages.length - 1].content;
        
        // 1. RUN PIPELINE (Single-Shot: Response + Extraction)
        const pipeline = new ContextAssemblyPipeline();
        const assemblyResult = await pipeline.run({
            conversation,
            userQuery,
            mentionedContacts: mentionedContacts || [],
            userMessageId,
            config: { episodicMemoryDepth: 10, semanticMemoryTopK: 3 },
        });

        const { llmResponse, extractedMemory, llmResponseTime } = assemblyResult;

        // 2. SAVE AI RESPONSE (The "Reply" part)
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

        // 3. PROCESS EXTRACTED MEMORY (Immediate - No extra API call needed!)
        if (extractedMemory) {
            const { entities, facts, userProfileUpdates } = extractedMemory;
            const brainId = conversation.brainId || null;

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
                        metadata: { conversationId: conversation.id, type: 'fact', sourceMessageId: savedAiMessage.id } 
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
            
            await logSystem('[Memory] Instant Extraction Processed', { 
                entities: entities?.length || 0, 
                facts: facts?.length || 0 
            });
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
