/**
 * @fileoverview Implementation of the Context Assembly Pipeline (Read Path).
 * This pipeline is responsible for gathering and synthesizing information from
 * various memory modules to create an optimized context for the LLM on each turn.
 */

import { IContextAssemblyConfig } from '../memory/types';
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { UpstashVectorMemoryModule, IVectorQueryResult } from '../memory/modules/upstash_vector';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '../llm';
import { Conversation, Contact, Message } from '@/lib/types';
import { sql } from '@/lib/db';

interface ContextAssemblyInput {
    conversation: Conversation;
    userQuery: string;
    config: IContextAssemblyConfig;
    mentionedContacts: Contact[];
    userMessageId: string;
}

interface ContextAssemblyOutput {
    llmResponse: string;
    llmResponseTime: number;
}

export class ContextAssemblyPipeline {

    private async logStep(runId: string, order: number, name: string, input: any, output: any, duration: number) {
        await sql`
            INSERT INTO pipeline_run_steps (run_id, step_order, step_name, input_payload, output_payload, duration_ms, status)
            VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
        `;
    }

    public async run(input: ContextAssemblyInput): Promise<ContextAssemblyOutput> {
        const startTime = Date.now();
        
        // 1. Create a run record
        const { rows: runRows } = await sql`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${input.userMessageId}, 'ContextAssembly', 'running')
            RETURNING id;
        `;
        const runId = runRows[0].id;

        try {
            let stepOrder = 1;
            const episodicMemory = new EpisodicMemoryModule();
            const vectorMemory = new UpstashVectorMemoryModule();
            const structuredMemory = new StructuredMemoryModule();

            // 2. Retrieve Episodic Memory
            const step1Time = Date.now();
            const recentMessages = await episodicMemory.query({
                conversationId: input.conversation.id,
                limit: input.config.episodicMemoryDepth,
            });
            await this.logStep(runId, stepOrder++, 'RetrieveEpisodicMemory', { limit: input.config.episodicMemoryDepth }, { messageCount: recentMessages.length }, Date.now() - step1Time);


            // 3. Retrieve Semantic Memory
            let semanticKnowledge: IVectorQueryResult[] = [];
            if (input.conversation.useSemanticMemory) {
                 const step2Time = Date.now();
                 semanticKnowledge = await vectorMemory.query({
                    queryText: input.userQuery,
                    topK: input.config.semanticMemoryTopK,
                });
                await this.logStep(runId, stepOrder++, 'RetrieveVectorMemory', { query: input.userQuery, topK: input.config.semanticMemoryTopK }, { results: semanticKnowledge.map(r => r.text) }, Date.now() - step2Time);
            }

            // 4. Retrieve Structured Memory
            // For now, this is just the mentioned contacts. Could be expanded to search entities.
            const step3Time = Date.now();
            await this.logStep(runId, stepOrder++, 'RetrieveStructuredMemory', { mentionedContacts: input.mentionedContacts.map(c => c.name) }, { contactCount: input.mentionedContacts.length }, Date.now() - step3Time);

            // 5. Assemble the prompt
            const step4Time = Date.now();
            let contextBlock = "--- CONTEXT ---\n";
            if (semanticKnowledge.length > 0) {
                contextBlock += "Potentially relevant information from knowledge base:\n" + semanticKnowledge.map(r => `- ${r.text}`).join('\n') + '\n';
            }
            if (input.mentionedContacts.length > 0) {
                contextBlock += "Information about mentioned contacts:\n" + input.mentionedContacts.map(c => `- ${c.name}: ${c.notes || ''}`).join('\n') + '\n';
            }
            
            const finalSystemInstruction = input.conversation.systemPrompt || "You are a helpful AI assistant.";
            const historyForLLM = recentMessages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));
            
            // Add the context block before the latest user message
            if (contextBlock !== "--- CONTEXT ---\n") {
                const lastMessage = historyForLLM.pop();
                if (lastMessage) {
                    historyForLLM.push({ role: 'user', parts: [{ text: contextBlock + "\n--- USER QUERY ---\n" + lastMessage.parts[0].text }] });
                }
            }
            await this.logStep(runId, stepOrder++, 'AssemblePrompt', { system: finalSystemInstruction }, { historyLength: historyForLLM.length }, Date.now() - step4Time);

            // 6. Call the LLM
            const step5Time = Date.now();
            const llmResponse = await llmProvider.generateContent(historyForLLM, finalSystemInstruction);
            const llmResponseTime = Date.now() - step5Time;
            await this.logStep(runId, stepOrder++, 'CallLLM', { model: 'gemini-2.5-flash' }, { response: llmResponse }, llmResponseTime);

            // 7. Finalize the run record
            const totalDuration = Date.now() - startTime;
             await sql`
                UPDATE pipeline_runs
                SET status = 'completed', 
                    duration_ms = ${totalDuration}, 
                    final_output = ${llmResponse},
                    final_llm_prompt = ${historyForLLM[historyForLLM.length - 1]?.parts[0].text},
                    final_system_instruction = ${finalSystemInstruction}
                WHERE id = ${runId};
            `;

            return { llmResponse, llmResponseTime };

        } catch (error) {
            const totalDuration = Date.now() - startTime;
            const errorMessage = (error as Error).message;
            await sql`
                UPDATE pipeline_runs
                SET status = 'failed', duration_ms = ${totalDuration}, final_output = ${errorMessage}
                WHERE id = ${runId};
            `;
            console.error("ContextAssemblyPipeline failed:", error);
            throw error;
        }
    }
}