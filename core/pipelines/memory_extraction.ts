
// core/pipelines/memory_extraction.ts
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { GraphMemoryModule } from '../memory/modules/graph';
import { ProfileMemoryModule } from '../memory/modules/profile';
import { DocumentMemoryModule } from '../memory/modules/document';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { GoogleGenAI, Type } from "@google/genai";
import { sql } from '@/lib/db';
import type { EntityDefinition } from '@/lib/types';

interface IMemoryExtractionParams {
    text: string;
    messageId: string;
    conversationId: string;
    brainId: string | null;
    config: any;
}

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;
    private graphMemory: GraphMemoryModule;
    private profileMemory: ProfileMemoryModule;
    private documentMemory: DocumentMemoryModule;
    private entityVectorMemory: EntityVectorMemoryModule;
    private ai: GoogleGenAI;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.graphMemory = new GraphMemoryModule();
        this.profileMemory = new ProfileMemoryModule();
        this.documentMemory = new DocumentMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        
        // ROBUST API KEY SELECTION
        // Iterates through candidates, cleans them, and picks the first one that looks valid (starts with AIza).
        const candidates = [process.env.API_KEY, process.env.GEMINI_API_KEY];
        let selectedKey: string | undefined = undefined;

        for (const candidate of candidates) {
            if (!candidate) continue;
            let key = candidate.trim();
            // Remove surrounding quotes if present
            if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
                key = key.substring(1, key.length - 1);
            }
            if (key.startsWith('AIza')) {
                selectedKey = key;
                break;
            }
        }

        if (!selectedKey) {
             throw new Error("MemoryExtractionPipeline: Valid API Key (starting with AIza) not found in environment variables.");
        }
        this.ai = new GoogleGenAI({ apiKey: selectedKey });
    }

    private async logEvent(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
        if (!process.env.POSTGRES_URL) return;
        try {
            await sql`INSERT INTO logs (message, payload, level) VALUES (${message}, ${JSON.stringify(payload)}, ${level})`;
        } catch (e) {
            console.error("Failed to log event:", e);
        }
    }

    async run(params: IMemoryExtractionParams) {
        const { text, messageId, conversationId, brainId } = params;
        const startTime = Date.now();

        // Include conversationId in ALL logs for UI traceability
        const logPayload = (extra: any = {}) => ({ ...extra, conversationId, messageId });

        await this.logEvent(`[Extraction] Starting pipeline`, logPayload({ textSnippet: text.substring(0, 50) + '...' }));

        // Create a pipeline run record for the "Write Path"
        let runId: string | null = null;
        try {
            const { rows: runRows } = await sql`
                INSERT INTO pipeline_runs ("messageId", "pipelineType", status)
                VALUES (${messageId}, 'MemoryExtraction', 'running') RETURNING id;
            `;
            runId = runRows[0].id;
        } catch (e) {
            console.warn("Failed to create pipeline run record:", e);
        }

        try {
            const prompt = `Analyze the following conversation text:
            "${text}"
            
            Tasks:
            1. Suggest a concise, descriptive title (3-5 words, in Arabic if the text is Arabic) for this conversation context.
            2. Extract structured knowledge:
               - Entities (People, Places, Concepts)
               - Facts (Key information to remember)
               - Relationships (How entities connect)
               - User Profile (Name, Role, Preferences mentioned)
            
            Return JSON.`;

            await this.logEvent(`[Extraction] Calling LLM for analysis...`, logPayload());
            
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A concise title for this conversation." },
                            aiIdentity: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } },
                            userProfile: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    name: { type: Type.STRING }, 
                                    role: { type: Type.STRING }, 
                                    preferences: { type: Type.ARRAY, items: { type: Type.STRING } } 
                                } 
                            },
                            entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, type: {type: Type.STRING}, description: {type: Type.STRING} } } },
                            relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, predicate: {type: Type.STRING}, target: {type: Type.STRING} } } },
                            facts: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });

            const data = JSON.parse(response.text?.trim() || '{}');
            await this.logEvent(`[Extraction] LLM returned data`, logPayload(data));

            // 0. Auto-Title Logic
            // If the LLM suggested a title, check if we should update the conversation.
            if (data.title) {
                // Update ONLY if the current title is one of the defaults (starts with 'New Chat' or 'محادثة جديدة').
                // This matches "محادثة جديدة" and "محادثة جديدة - 10/20 5:00 PM"
                const result = await sql`
                    UPDATE conversations 
                    SET title = ${data.title}, "lastUpdatedAt" = CURRENT_TIMESTAMP
                    WHERE id = ${conversationId} 
                      AND (title LIKE 'New Chat%' OR title LIKE 'محادثة جديدة%' OR title IS NULL);
                `;
                // Use nullish coalescing to handle potential null rowCount
                if ((result.rowCount ?? 0) > 0) {
                     await this.logEvent(`[Extraction] Auto-updated conversation title: ${data.title}`, logPayload());
                }
            }

            // Syncing steps with individual logs
            if (data.aiIdentity?.name) {
                await this.logEvent(`[Extraction] Syncing AI Name: ${data.aiIdentity.name}`, logPayload());
                await this.profileMemory.store({ aiName: data.aiIdentity.name });
            }

            if (data.userProfile) {
                await this.logEvent(`[Extraction] Syncing User Profile`, logPayload(data.userProfile));
                await this.profileMemory.store(data.userProfile);
            }

            for (const fact of (data.facts || [])) {
                await this.logEvent(`[Extraction] Storing Fact: ${fact}`, logPayload());
                await this.semanticMemory.store({ text: fact, metadata: { conversationId, type: 'fact' } });
            }

            for (const entity of (data.entities || [])) {
                await this.logEvent(`[Extraction] Defining Entity: ${entity.name}`, logPayload(entity));
                const saved = await this.structuredMemory.store({ type: 'entity', data: { ...entity, brainId } });
                if (saved?.id) await this.entityVectorMemory.store({ id: saved.id, text: `${saved.name}: ${saved.description}`, metadata: { brainId } });
            }
            
            // Relationships would be stored via GraphMemory here (implementation skipped for brevity as GraphMemory logic wasn't fully requested to be changed, just extraction flow)

            const duration = Date.now() - startTime;
            if (runId) {
                await sql`UPDATE pipeline_runs SET status = 'completed', "durationMs" = ${duration}, "finalOutput" = ${JSON.stringify(data)} WHERE id = ${runId}`;
            }
            await this.logEvent(`[Extraction] Pipeline completed`, logPayload({ durationMs: duration }));

        } catch (error) {
            const err = error as Error;
            await this.logEvent(`[Extraction] Pipeline failed`, logPayload({ error: err.message }), 'error');
            if (runId) {
                await sql`UPDATE pipeline_runs SET status = 'failed', "finalOutput" = ${err.message} WHERE id = ${runId}`;
            }
        }
    }
}
