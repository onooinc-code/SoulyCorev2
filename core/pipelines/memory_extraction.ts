
// core/pipelines/memory_extraction.ts
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { ProfileMemoryModule } from '../memory/modules/profile';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { GoogleGenAI, Type } from "@google/genai";
import { sql } from '@/lib/db';

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
    private profileMemory: ProfileMemoryModule;
    private entityVectorMemory: EntityVectorMemoryModule;
    private ai: GoogleGenAI;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.profileMemory = new ProfileMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        this.ai = new GoogleGenAI({ apiKey: apiKey || "DUMMY" });
    }

    private async logEvent(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
        try {
            await sql`INSERT INTO logs (message, payload, level) VALUES (${message}, ${JSON.stringify(payload)}, ${level})`;
        } catch (e) {}
    }

    async run(params: IMemoryExtractionParams) {
        const { text, messageId, conversationId, brainId } = params;
        if (text.length < 15) return;

        const startTime = Date.now();
        let runId: string | null = null;
        try {
            const { rows } = await sql`INSERT INTO pipeline_runs ("messageId", "pipelineType", status) VALUES (${messageId}, 'MemoryExtraction', 'running') RETURNING id;`;
            runId = rows[0].id;
        } catch (e) {}

        try {
            const prompt = `Analyze: "${text}". Extract Entities, Facts, User Profile. Return JSON.`;
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            userProfile: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, preferences: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                            entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, type: {type: Type.STRING}, description: {type: Type.STRING} } } },
                            facts: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });

            const data = JSON.parse(response.text?.trim() || '{}');

            if (data.userProfile) await this.profileMemory.store(data.userProfile);

            for (const fact of (data.facts || [])) {
                await this.semanticMemory.store({ text: fact, metadata: { conversationId, type: 'fact' } });
            }

            for (const entity of (data.entities || [])) {
                // IMPORTANT: StructuredMemory handles UPSERT.
                const saved = await this.structuredMemory.store({ type: 'entity', data: { ...entity, brainId } });
                // CRITICAL FIX: Always update the vector store so RAG can find this entity in future turns.
                if (saved?.id) {
                    await this.entityVectorMemory.store({ 
                        id: saved.id, 
                        text: `${saved.name} (${saved.type}): ${saved.description}`, 
                        metadata: { brainId, lastUpdated: new Date().toISOString() } 
                    });
                }
            }

            if (runId) {
                const duration = Date.now() - startTime;
                await sql`UPDATE pipeline_runs SET status = 'completed', "durationMs" = ${duration}, "finalOutput" = ${JSON.stringify(data)} WHERE id = ${runId}`;
            }

        } catch (error: any) {
            await this.logEvent(`[Extraction] Failed`, { error: error.message }, 'error');
            if (runId) await sql`UPDATE pipeline_runs SET status = 'failed', "finalOutput" = ${error.message} WHERE id = ${runId}`;
        }
    }
}
