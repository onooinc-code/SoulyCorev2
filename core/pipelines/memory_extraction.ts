/**
 * @fileoverview Implementation of the Memory Extraction Pipeline (Write Path).
 * This pipeline runs post-conversation to analyze the exchange, extract knowledge,
 * and commit it to the appropriate long-term Single Memory Modules (SMMs).
 */

import { IMemoryExtractionConfig } from '../memory/types';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '../llm';
import { sql } from '@/lib/db';
import { Type } from '@google/genai';

interface MemoryExtractionInput {
    text: string; // The text to analyze (e.g., user query + AI response)
    messageId: string;
    conversationId: string;
    config: IMemoryExtractionConfig;
}

export class MemoryExtractionPipeline {

     private async logStep(runId: string, order: number, name: string, input: any, output: any, duration: number) {
        await sql`
            INSERT INTO pipeline_run_steps (run_id, step_order, step_name, input_payload, output_payload, duration_ms, status)
            VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
        `;
    }
    
    public async run(input: MemoryExtractionInput): Promise<void> {
        const startTime = Date.now();
        const { rows: runRows } = await sql`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${input.messageId}, 'MemoryExtraction', 'running')
            RETURNING id;
        `;
        const runId = runRows[0].id;
        
        try {
            let stepOrder = 1;

            if (input.config.enableEntityExtraction) {
                const step1Time = Date.now();
                const entities = await this.extractEntities(input.text);
                 await this.logStep(runId, stepOrder++, 'ExtractEntities', { text: input.text }, { entities }, Date.now() - step1Time);

                if (entities.length > 0) {
                    const step2Time = Date.now();
                    await this.storeEntities(entities);
                    await this.logStep(runId, stepOrder++, 'StoreEntities', { entities }, { count: entities.length }, Date.now() - step2Time);
                }
            }

            if (input.config.enableKnowledgeExtraction) {
                const step3Time = Date.now();
                const knowledgeChunks = await this.extractKnowledge(input.text);
                await this.logStep(runId, stepOrder++, 'ExtractKnowledge', { text: input.text }, { chunks: knowledgeChunks }, Date.now() - step3Time);

                if (knowledgeChunks.length > 0) {
                    const step4Time = Date.now();
                    await this.storeKnowledge(knowledgeChunks);
                    await this.logStep(runId, stepOrder++, 'StoreKnowledge', { chunks: knowledgeChunks }, { count: knowledgeChunks.length }, Date.now() - step4Time);
                }
            }

            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'completed', duration_ms = ${totalDuration} WHERE id = ${runId};
            `;
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            const errorMessage = (error as Error).message;
             await sql`
                UPDATE pipeline_runs SET status = 'failed', duration_ms = ${totalDuration}, final_output = ${errorMessage} WHERE id = ${runId};
            `;
            console.error("MemoryExtractionPipeline failed:", error);
            // Don't rethrow, as this is a background task.
        }
    }

    private async extractEntities(text: string): Promise<{name: string; type: string; details: any}[]> {
        const prompt = `
            Analyze the following text and extract key entities (people, places, projects, concepts). 
            For each entity, provide its name, a general type, and a JSON object with any relevant details.

            Text to analyze:
            "${text}"
        `;
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    details: { type: Type.OBJECT },
                },
            },
        };
        const response = await llmProvider.generateContent(
            [{ role: 'user', parts: [{ text: prompt }] }],
            "You are a data extraction expert.",
            // @ts-ignore - The SDK types might not be fully updated for responseSchema
            { responseMimeType: 'application/json', responseSchema }
        );
        try {
            return JSON.parse(response);
        } catch (e) {
            console.error("Failed to parse entities from LLM response:", response);
            return [];
        }
    }

    private async storeEntities(entities: {name: string; type: string; details: any}[]): Promise<void> {
        const structuredMemory = new StructuredMemoryModule();
        for (const entity of entities) {
            await structuredMemory.store({
                type: 'entity',
                data: {
                    name: entity.name,
                    type: entity.type,
                    details_json: JSON.stringify(entity.details),
                }
            });
        }
    }

    private async extractKnowledge(text: string): Promise<string[]> {
        const prompt = `
            Analyze the following text and extract standalone facts or pieces of knowledge that would be useful for future reference.
            Each piece of knowledge should be a self-contained sentence or two.
            Return a JSON array of strings, where each string is a knowledge chunk.

            Text to analyze:
            "${text}"
        `;
         const responseSchema = {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        };
        const response = await llmProvider.generateContent(
            [{ role: 'user', parts: [{ text: prompt }] }],
            "You are a knowledge extraction expert.",
             // @ts-ignore
            { responseMimeType: 'application/json', responseSchema }
        );
        try {
            return JSON.parse(response);
        } catch (e) {
            console.error("Failed to parse knowledge from LLM response:", response);
            return [];
        }
    }

    private async storeKnowledge(chunks: string[]): Promise<void> {
        const semanticMemory = new SemanticMemoryModule();
        for (const chunk of chunks) {
            await semanticMemory.store({ text: chunk });
        }
    }
}
