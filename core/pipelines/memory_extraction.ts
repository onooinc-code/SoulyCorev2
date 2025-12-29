
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
        
        // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
             throw new Error("MemoryExtractionPipeline: API Key not found in environment variables.");
        }
        this.ai = new GoogleGenAI({ apiKey });
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
            const prompt = `Analyze: "${text}"
            Extract structured knowledge. Text is likely in Arabic. 
            Categories: aiIdentity (name), userProfile (name, role, preferences), entities (name, type, desc), relationships (source, predicate, target), facts (statements).
            Return ONLY JSON.`;

            await this.logEvent(`[Extraction] Calling LLM for analysis...`, logPayload());
            
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
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
