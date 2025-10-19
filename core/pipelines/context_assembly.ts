import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '../llm';
import { HistoryContent } from '../llm/types';
import { IContextAssemblyConfig } from '../memory/types';
import type { Contact } from '@/lib/types';
import { sql } from '@/lib/db';

interface PipelineInput {
    conversationId: string;
    userQuery: string;
    config: IContextAssemblyConfig;
    mentionedContacts?: Contact[];
    userMessageId: string;
}

interface PipelineOutput {
    llmResponse: string;
    llmResponseTime: number;
}

export class ContextAssemblyPipeline {
    private episodicMemory = new EpisodicMemoryModule();
    private semanticMemory = new SemanticMemoryModule();
    private structuredMemory = new StructuredMemoryModule();

    async run(input: PipelineInput): Promise<PipelineOutput> {
        const runId = (await sql`INSERT INTO pipeline_runs (pipeline_type, status, message_id) VALUES ('ContextAssembly', 'running', ${input.userMessageId}) RETURNING id;`).rows[0].id;
        let finalSystemInstruction = "You are a helpful AI assistant.";
        let finalHistory: HistoryContent[] = [];

        try {
            // Step 1: Retrieve Episodic Memory
            const recentMessages = await this.episodicMemory.query({ conversationId: input.conversationId, limit: input.config.episodicMemoryDepth });
            finalHistory = recentMessages.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }));
            await sql`INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload) VALUES (${runId}, 1, 'Retrieve Episodic Memory', 'completed', ${JSON.stringify({ messageCount: recentMessages.length })})`;

            // Step 2: Retrieve Semantic Memory
            const knowledgeChunks = await this.semanticMemory.query({ queryText: input.userQuery, topK: input.config.semanticMemoryTopK });
            let contextString = "";
            if (knowledgeChunks.length > 0) {
                contextString += "--- Relevant Knowledge ---\n" + knowledgeChunks.map(c => c.text).join('\n') + "\n";
            }
            await sql`INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload) VALUES (${runId}, 2, 'Retrieve Semantic Memory', 'completed', ${JSON.stringify({ chunksRetrieved: knowledgeChunks.length })})`;

            // Step 3: Add Mentioned Contacts
            if (input.mentionedContacts && input.mentionedContacts.length > 0) {
                contextString += "--- Mentioned Contacts ---\n" + input.mentionedContacts.map(c => `Name: ${c.name}, Details: ${c.notes || c.company || c.email}`).join('\n') + "\n";
            }
             await sql`INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload) VALUES (${runId}, 3, 'Incorporate Mentions', 'completed', ${JSON.stringify({ contactsIncluded: input.mentionedContacts?.length || 0 })})`;

            // Step 4: Assemble Final Prompt
            if (contextString) {
                finalSystemInstruction = `${finalSystemInstruction}\n\nUse the following context to inform your response:\n${contextString}`;
            }

            // Step 5: Call LLM
            const startTime = Date.now();
            const llmResponse = await llmProvider.generateContent(finalHistory, finalSystemInstruction);
            const llmResponseTime = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload, duration_ms, model_used, prompt_used) 
                VALUES (${runId}, 4, 'Generate Response', 'completed', ${JSON.stringify({ responseLength: llmResponse.length })}, ${llmResponseTime}, 'gemini-2.5-flash', ${input.userQuery});
            `;

            const runStartTime = (await sql`SELECT "createdAt" FROM pipeline_runs WHERE id = ${runId}`).rows[0].createdAt.getTime();

            // Finalize run
            await sql`
                UPDATE pipeline_runs 
                SET status = 'completed', final_output = ${llmResponse}, duration_ms = ${Date.now() - runStartTime},
                final_llm_prompt = ${finalHistory[finalHistory.length - 1]?.parts[0].text},
                final_system_instruction = ${finalSystemInstruction}
                WHERE id = ${runId};
            `;

            return { llmResponse, llmResponseTime };

        } catch (error) {
            const runStartTime = (await sql`SELECT "createdAt" FROM pipeline_runs WHERE id = ${runId}`).rows[0].createdAt.getTime();
            await sql`UPDATE pipeline_runs SET status = 'failed', final_output = ${(error as Error).message}, duration_ms = ${Date.now() - runStartTime} WHERE id = ${runId};`;
            throw error;
        }
    }
}
