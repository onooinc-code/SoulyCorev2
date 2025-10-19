import { StructuredMemoryModule } from '../memory/modules/structured';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { IMemoryExtractionConfig } from '../memory/types';
import { extractDataFromText } from '@/lib/gemini-server';
import { sql } from '@/lib/db';

interface PipelineInput {
    text: string;
    messageId: string;
    conversationId: string;
    config: IMemoryExtractionConfig;
}

export class MemoryExtractionPipeline {
    private structuredMemory = new StructuredMemoryModule();
    private semanticMemory = new SemanticMemoryModule();

    async run(input: PipelineInput): Promise<void> {
        const runResult = await sql`INSERT INTO pipeline_runs (pipeline_type, status, message_id) VALUES ('MemoryExtraction', 'running', ${input.messageId}) RETURNING id, "createdAt";`;
        const runId = runResult.rows[0].id;
        const startTime = new Date(runResult.rows[0].createdAt).getTime();
        
        try {
            // Step 1: Extract Data using LLM
            const extractedData = await extractDataFromText(input.text);
            await sql`INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload) VALUES (${runId}, 1, 'Extract Entities and Knowledge', 'completed', ${JSON.stringify({ entities: extractedData.entities.length, knowledge: extractedData.knowledge.length })})`;

            // Step 2: Store Entities
            if (input.config.enableEntityExtraction && extractedData.entities.length > 0) {
                for (const entity of extractedData.entities) {
                    await this.structuredMemory.store({
                        type: 'entity',
                        data: {
                            name: entity.name,
                            type: entity.type,
                            details_json: JSON.stringify(entity.details)
                        }
                    });
                }
            }
            await sql`INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload) VALUES (${runId}, 2, 'Store Structured Entities', 'completed', ${JSON.stringify({ count: extractedData.entities.length })})`;

            // Step 3: Store Knowledge
            if (input.config.enableKnowledgeExtraction && extractedData.knowledge.length > 0) {
                for (const chunk of extractedData.knowledge) {
                    await this.semanticMemory.store({ text: chunk });
                }
            }
             await sql`INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload) VALUES (${runId}, 3, 'Store Semantic Knowledge', 'completed', ${JSON.stringify({ count: extractedData.knowledge.length })})`;

            // Finalize run
            await sql`UPDATE pipeline_runs SET status = 'completed', duration_ms = ${Date.now() - startTime} WHERE id = ${runId};`;
        } catch (error) {
            console.error(`MemoryExtractionPipeline failed for run ${runId}`, error);
            await sql`UPDATE pipeline_runs SET status = 'failed', final_output = ${(error as Error).message}, duration_ms = ${Date.now() - startTime} WHERE id = ${runId};`;
            // Do not re-throw, as this is a background process.
        }
    }
}
