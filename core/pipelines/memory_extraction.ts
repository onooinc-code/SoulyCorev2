
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
        const candidates = [process.env.API_KEY, process.env.GEMINI_API_KEY];
        let selectedKey: string | undefined = undefined;

        for (const candidate of candidates) {
            if (!candidate) continue;
            let key = candidate.trim();
            if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
                key = key.substring(1, key.length - 1);
            }
            if (key.startsWith('AIza')) {
                selectedKey = key;
                break;
            }
        }

        if (!selectedKey) {
             console.warn("MemoryExtractionPipeline: Valid API Key not found. Pipeline will fail.");
        }
        this.ai = new GoogleGenAI({ apiKey: selectedKey || "DUMMY" });
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
        
        // 1. OPTIMIZATION: Skip extraction for very short messages to save quota
        if (text.length < 20) {
            await this.logEvent(`[Extraction] Skipped (Text too short)`, { length: text.length });
             try {
                await sql`
                    INSERT INTO pipeline_runs ("messageId", "pipelineType", status, "finalOutput")
                    VALUES (${messageId}, 'MemoryExtraction', 'completed', '{"skipped": true, "reason": "Text too short"}');
                `;
            } catch (e) {}
            return;
        }

        const startTime = Date.now();
        const logPayload = (extra: any = {}) => ({ ...extra, conversationId, messageId });

        await this.logEvent(`[Extraction] Starting pipeline`, logPayload({ textSnippet: text.substring(0, 50) + '...' }));

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
            const prompt = `Analyze this conversation text:
            "${text}"
            
            Tasks:
            1. Extract Entities (People, Places, Concepts).
            2. Extract Facts (Key info).
            3. Extract User Profile (Name, Role, Likes).
            4. Suggest a Title (if relevant).
            
            Return JSON.`;

            await this.logEvent(`[Extraction] Calling LLM...`, logPayload());
            
            // 2. OPTIMIZATION: Use 'gemini-2.5-flash' instead of 3-flash for background tasks to save quota
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            aiIdentity: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } },
                            userProfile: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, preferences: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                            entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, type: {type: Type.STRING}, description: {type: Type.STRING} } } },
                            relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, predicate: {type: Type.STRING}, target: {type: Type.STRING} } } },
                            facts: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });

            const data = JSON.parse(response.text?.trim() || '{}');
            await this.logEvent(`[Extraction] Data received`, logPayload({ entityCount: data.entities?.length || 0 }));

            // --- Storage Logic ---

            // Auto-Title
            if (data.title) {
                const result = await sql`
                    UPDATE conversations 
                    SET title = ${data.title}, "lastUpdatedAt" = CURRENT_TIMESTAMP
                    WHERE id = ${conversationId} 
                      AND (title LIKE 'New Chat%' OR title LIKE 'محادثة جديدة%' OR title IS NULL);
                `;
            }

            // Profile
            if (data.userProfile) {
                await this.profileMemory.store(data.userProfile);
            }

            // Facts (Semantic)
            for (const fact of (data.facts || [])) {
                await this.semanticMemory.store({ text: fact, metadata: { conversationId, type: 'fact' } });
            }

            // Entities (Structured)
            for (const entity of (data.entities || [])) {
                const saved = await this.structuredMemory.store({ type: 'entity', data: { ...entity, brainId } });
                // Also save to vector store for "Hybrid Search" to work
                if (saved?.id) await this.entityVectorMemory.store({ id: saved.id, text: `${saved.name}: ${saved.description}`, metadata: { brainId } });
            }

            const duration = Date.now() - startTime;
            if (runId) {
                await sql`UPDATE pipeline_runs SET status = 'completed', "durationMs" = ${duration}, "finalOutput" = ${JSON.stringify(data)} WHERE id = ${runId}`;
            }
            await this.logEvent(`[Extraction] Completed`, logPayload({ durationMs: duration }));

        } catch (error) {
            const err = error as Error;
            const isRateLimit = err.message.includes('429') || err.message.includes('Quota');
            
            // Log specifically if it's a rate limit so we know
            const logMsg = isRateLimit ? `[Extraction] Rate Limit Hit (Skipping)` : `[Extraction] Failed`;
            
            await this.logEvent(logMsg, logPayload({ error: err.message }), 'error');
            
            if (runId) {
                // If rate limit, mark as 'failed' but with a clear message so UI can show it nicely
                const outputMsg = isRateLimit ? "Background extraction skipped due to API quota limits. Data will be processed in future turns." : err.message;
                await sql`UPDATE pipeline_runs SET status = 'failed', "finalOutput" = ${outputMsg} WHERE id = ${runId}`;
            }
        }
    }
}
