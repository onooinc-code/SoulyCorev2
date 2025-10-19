import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import type { PipelineRun } from '@/lib/types';
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
    private ai: GoogleGenAI;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
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
                INSERT INTO pipeline_run_steps (run_id, step_order, step_name, input_payload, output_payload, duration_ms, status)
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
            `;
            return output;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = (error as Error).message;
            await sql`
                INSERT INTO pipeline_run_steps (run_id, step_order, step_name, input_payload, duration_ms, status, error_message)
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${duration}, 'failed', ${errorMessage});
            `;
            throw error;
        }
    }

    async run(params: IMemoryExtractionParams) {
        const { text, messageId, conversationId, config } = params;
        
        const { rows: runRows } = await sql<PipelineRun>`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${messageId}, 'MemoryExtraction', 'running') RETURNING id;
        `;
        const runId = runRows[0].id;
        const startTime = Date.now();

        try {
            const extractionResult = await this.logStep(runId, 1, 'Extract Entities and Knowledge', { text }, async () => {
                const prompt = `Analyze the following text and extract key information. The text is a conversation between a user and an AI.
                
                Text to analyze:
                "${text}"

                Respond with a JSON object containing two keys: "entities" and "knowledge".
                - "entities" should be an array of objects, where each object represents a person, place, project, or concept with "name" and "type" keys.
                - "knowledge" should be an array of strings, where each string is a self-contained, factual statement or piece of information worth remembering.
                `;
                
                const response = await this.ai.models.generateContent({
                    // @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for this task.
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
                                            type: { type: Type.STRING }
                                        },
                                        required: ['name', 'type']
                                    }
                                },
                                knowledge: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            },
                             required: ['entities', 'knowledge'],
                        }
                    }
                });
                // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
                return JSON.parse(response.text.trim());
            });

            if (config.enableEntityExtraction && extractionResult.entities) {
                await this.logStep(runId, 2, 'Store Entities', { count: extractionResult.entities.length }, () =>
                    Promise.all(extractionResult.entities.map((entity: any) =>
                        this.structuredMemory.store({ type: 'entity', data: entity })
                    ))
                );
            }

            if (config.enableKnowledgeExtraction && extractionResult.knowledge) {
                 await this.logStep(runId, 3, 'Store Knowledge', { count: extractionResult.knowledge.length }, () =>
                    Promise.all(extractionResult.knowledge.map((k: string) =>
                        this.semanticMemory.store({ text: k })
                    ))
                );
            }
            
            // Segment extraction logic is a placeholder for now
            if (config.enableSegmentExtraction) {
                await this.logStep(runId, 4, 'Extract Segments', { text }, async () => {
                    // In a real implementation, this would be another LLM call to categorize the conversation.
                    return { segments: ['Project Alpha', 'Q3 Planning'] }; // Mock result
                });
            }


            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'completed', duration_ms = ${totalDuration}, final_output = ${'Extraction successful.'} WHERE id = ${runId};
            `;
            
        } catch (error) {
             const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'failed', duration_ms = ${totalDuration}, final_output = ${(error as Error).message} WHERE id = ${runId};
            `;
            console.error("MemoryExtractionPipeline failed:", error);
            throw error;
        }
    }
}