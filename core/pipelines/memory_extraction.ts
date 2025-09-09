/**
 * @fileoverview Implements the Memory Extraction Pipeline (Write Path).
 * This service analyzes a completed conversation turn, uses the LLM to extract key
 * information, and stores it in the appropriate long-term memory modules.
 */

import { sql } from '@/lib/db';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { GoogleGenAI, Type } from "@google/genai";

interface IExtractAndStoreParams {
    textToAnalyze: string;
    runId: string; // For logging
}

interface IExtractedData {
    entities: { name: string; type: string; details: string; }[];
    knowledge: string[];
}

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
    }
    
    private async logStep<T>(
        runId: string,
        stepOrder: number,
        stepName: string,
        fn: () => Promise<T>,
        details?: { input?: any; model?: string; prompt?: string; config?: any; }
    ): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps (
                    run_id, step_order, step_name, status, input_payload, 
                    output_payload, model_used, prompt_used, config_used, 
                    duration_ms, end_time
                )
                VALUES (
                    ${runId}, ${stepOrder}, ${stepName}, 'completed', 
                    ${details?.input ? JSON.stringify(details.input) : null}, 
                    ${JSON.stringify(result)}, ${details?.model || null}, ${details?.prompt || null}, 
                    ${details?.config ? JSON.stringify(details.config) : null}, 
                    ${duration}, CURRENT_TIMESTAMP
                );
            `;
            return result;
        } catch (e) {
            const duration = Date.now() - startTime;
            const errorMessage = (e as Error).message;
            await sql`
                INSERT INTO pipeline_run_steps (
                    run_id, step_order, step_name, status, input_payload, 
                    error_message, duration_ms, end_time
                )
                VALUES (
                    ${runId}, ${stepOrder}, ${stepName}, 'failed', 
                    ${details?.input ? JSON.stringify(details.input) : null}, 
                    ${errorMessage}, ${duration}, CURRENT_TIMESTAMP
                );
            `;
            throw e;
        }
    }


    /**
     * Analyzes a block of text, extracts structured entities and semantic knowledge,
     * and stores them in their respective memory modules.
     * @param params - An object containing the text to analyze and the runId for logging.
     * @returns A promise that resolves when the extraction and storage are complete.
     */
    async extractAndStore(params: IExtractAndStoreParams): Promise<void> {
        const { textToAnalyze, runId } = params;
        const startTime = Date.now();

        try {
            const extractedData = await this.extractDataWithLLM(textToAnalyze, runId);

            if (!extractedData) {
                throw new Error("Failed to extract data from text.");
            }

            const { entities, knowledge } = extractedData;
            let finalOutput = '';

            if (entities && entities.length > 0) {
                await this.logStep(runId, 2, 'StoreEntities', async () => {
                    for (const entity of entities) {
                        await this.structuredMemory.store({ type: 'entity', data: { name: entity.name, type: entity.type, details_json: entity.details } });
                    }
                    return { storedCount: entities.length };
                });
                finalOutput += `Stored ${entities.length} entities. `;
            }

            if (knowledge && knowledge.length > 0) {
                 await this.logStep(runId, 3, 'StoreKnowledge', async () => {
                    for (const chunk of knowledge) {
                        if (chunk.split(' ').length < 5) continue;
                        await this.semanticMemory.store({ text: chunk });
                    }
                    return { storedCount: knowledge.length };
                 });
                 finalOutput += `Stored ${knowledge.length} knowledge chunks.`;
            }

            // Finalize the main run record
            const duration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'completed', final_output = ${finalOutput}, end_time = CURRENT_TIMESTAMP, duration_ms = ${duration} WHERE id = ${runId};
            `;
        } catch (e) {
            const duration = Date.now() - startTime;
            const errorMessage = (e as Error).message;
             await sql`
                UPDATE pipeline_runs SET status = 'failed', error_message = ${errorMessage}, end_time = CURRENT_TIMESTAMP, duration_ms = ${duration} WHERE id = ${runId};
            `;
             console.error(`MemoryExtractionPipeline failed for run ${runId}:`, e);
        }
    }

    /**
     * Uses the configured LLM provider to extract structured data from a text block.
     * This is a private helper method for the pipeline.
     * @param text - The text to analyze.
     * @param runId - The ID of the current pipeline run for logging.
     * @returns A promise that resolves with the extracted data object.
     */
    private async extractDataWithLLM(text: string, runId: string): Promise<IExtractedData | null> {
        const prompt = `
            From the following text, perform two tasks:
            1. Extract key entities (people, places, organizations, projects, concepts).
            2. Extract distinct, self-contained chunks of information that could be useful knowledge for the future.
            
            Return the result as a single JSON object with two keys: "entities" and "knowledge".
            - "entities" should be an array of objects, each with "name", "type", and "details" properties.
            - "knowledge" should be an array of strings. Do not extract trivial statements.

            Text:
            ---
            ${text}
            ---
        `;

        const modelConfig = {
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
                                details: { type: Type.STRING }
                            },
                            required: ['name', 'type', 'details']
                        }
                    },
                    knowledge: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['entities', 'knowledge']
            }
        };
        
        // @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
        const modelName = 'gemini-2.5-flash';

        const fn = async () => {
            try {
                const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
                if (!apiKey) throw new Error("API key not found for extraction.");
                const ai = new GoogleGenAI({ apiKey });

                const result = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: modelConfig,
                });

                if (!result || !result.text) {
                    console.error("Data extraction failed: No text in response.");
                    return { entities: [], knowledge: [] };
                }
                const jsonStr = result.text.trim();
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error("MemoryExtractionPipeline: LLM data extraction failed:", e);
                throw e; // Re-throw to be caught by logStep
            }
        };

        return this.logStep(runId, 1, 'ExtractDataWithLLM', fn, {
            input: { textLength: text.length },
            model: modelName,
            prompt,
            config: modelConfig,
        });
    }
}