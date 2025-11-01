import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import type { PipelineRun, EntityDefinition } from '@/lib/types';
import { IMemoryExtractionConfig } from '../memory/types';
import { GoogleGenAI, Type } from "@google/genai";

interface IMemoryExtractionParams {
    text: string;
    messageId: string;
    conversationId: string;
    config: IMemoryExtractionConfig;
}

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;
    private entityVectorMemory: EntityVectorMemoryModule;
    private ai: GoogleGenAI;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not found for MemoryExtractionPipeline.");
        }
        // @google/genai-api-guideline-fix: Initialize GoogleGenAI with a named apiKey parameter.
        this.ai = new GoogleGenAI({ apiKey });
    }

    private async logStep(runId: string, order: number, name: string, input: any, execution: () => Promise<any>) {
        const startTime = Date.now();
        try {
            const output = await execution();
            const duration = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "outputPayload", "durationMs", status)
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
            `;
            return output;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = (error as Error).message;
            await sql`
                INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "durationMs", status, "errorMessage")
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${duration}, 'failed', ${errorMessage});
            `;
            throw error;
        }
    }

    async run(params: IMemoryExtractionParams) {
        const { text, messageId, conversationId, config } = params;
        
        const { rows: runRows } = await sql<PipelineRun>`
            INSERT INTO pipeline_runs ("messageId", "pipelineType", status)
            VALUES (${messageId}, 'MemoryExtraction', 'running') RETURNING id;
        `;
        const runId = runRows[0].id;
        const startTime = Date.now();

        try {
            const extractionResult = await this.logStep(runId, 1, 'Extract Entities, Knowledge, and Relationships', { text }, async () => {
                const prompt = `Analyze the following text from a conversation between a user and an AI. Your task is to extract key information and structure it as a JSON object.

                Text to analyze:
                "${text}"

                Respond with a JSON object containing three keys: "entities", "knowledge", and "relationships".
                - "entities": An array of objects. Each object should represent a distinct person, place, project, company, or important concept. Include a "name", a "type", and a concise "description" summarizing all relevant details from the text.
                - "knowledge": An array of strings. Each string must be a self-contained, factual statement or piece of information worth remembering.
                - "relationships": An array of objects representing the connections between the entities found in the text. Each object must have "source" (the name of the source entity), "predicate" (the verb or connecting phrase, e.g., 'works_for', 'is_located_in'), and "target" (the name of the target entity).
                `;
                
                const response = await this.ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                         responseMimeType: "application/json",
                         responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                entities: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING },
                                            type: { type: Type.STRING },
                                            description: { type: Type.STRING }
                                        },
                                        required: ['name', 'type', 'description']
                                    }
                                },
                                knowledge: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                relationships: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            source: { type: Type.STRING },
                                            predicate: { type: Type.STRING },
                                            target: { type: Type.STRING }
                                        },
                                        required: ['source', 'predicate', 'target']
                                    }
                                }
                            },
                             required: ['entities', 'knowledge', 'relationships'],
                        }
                    }
                });
                if (!response.text) {
                    throw new Error("AI failed to extract information. The response was empty.");
                }
                return JSON.parse(response.text.trim());
            });

            if (config.enableEntityExtraction && extractionResult.entities && extractionResult.entities.length > 0) {
                const storedEntities = await this.logStep(runId, 2, 'Store Entities & Embeddings', { count: extractionResult.entities.length }, async () => {
                    const stored = await Promise.all(extractionResult.entities.map((entity: any) =>
                        this.structuredMemory.store({ type: 'entity', data: entity })
                    ));

                    // Now store embeddings for the successfully stored entities
                    await Promise.all(stored.map((entity: EntityDefinition) => {
                        if (entity && entity.id) {
                            const embeddingText = `${entity.name} (${entity.type}): ${entity.description}`;
                            return this.entityVectorMemory.store({ id: entity.id, text: embeddingText, metadata: { entity_id: entity.id, name: entity.name, type: entity.type, is_entity: true } });
                        }
                    }));
                    
                    return stored;
                });

                // After storing entities, process relationships
                if (extractionResult.relationships && extractionResult.relationships.length > 0) {
                    await this.logStep(runId, 3, 'Store Relationships', { count: extractionResult.relationships.length }, async () => {
                         // Create a map of entity names to IDs for quick lookup
                        const allEntities = [...storedEntities, ...(await this.structuredMemory.query({type: 'entity'}))];
                        const entityMap = new Map(allEntities.map(e => [e.name.toLowerCase(), e.id]));

                        for (const rel of extractionResult.relationships) {
                            const sourceId = entityMap.get(rel.source.toLowerCase());
                            const targetId = entityMap.get(rel.target.toLowerCase());

                            if (sourceId && targetId) {
                                await this.structuredMemory.store({
                                    type: 'relationship',
                                    data: {
                                        sourceEntityId: sourceId,
                                        targetEntityId: targetId,
                                        predicate: rel.predicate,
                                    }
                                });
                            }
                        }
                    });
                }
            }

            if (config.enableKnowledgeExtraction && extractionResult.knowledge) {
                 await this.logStep(runId, 4, 'Store Knowledge', { count: extractionResult.knowledge.length }, () =>
                    Promise.all(extractionResult.knowledge.map((k: string) =>
                        this.semanticMemory.store({ text: k })
                    ))
                );
            }
            
            if (config.enableSegmentExtraction) {
                await this.logStep(runId, 5, 'Extract Segments', { text }, async () => {
                    return { segments: ['Project Alpha', 'Q3 Planning'] }; // Mock result
                });
            }


            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${'Extraction successful.'} WHERE id = ${runId};
            `;
            
        } catch (error) {
             const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'failed', "durationMs" = ${totalDuration}, "finalOutput" = ${(error as Error).message} WHERE id = ${runId};
            `;
            console.error("MemoryExtractionPipeline failed:", error);
            throw error;
        }
    }
}