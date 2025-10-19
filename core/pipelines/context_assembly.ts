// core/pipelines/context_assembly.ts
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { sql } from '@/lib/db';
import llmProvider from '@/core/llm';
import type { Conversation, Contact, PipelineRun } from '@/lib/types';
import { IContextAssemblyConfig } from '../memory/types';
import type { Content } from '@google/genai';

interface IContextAssemblyParams {
    conversation: Conversation;
    userQuery: string;
    mentionedContacts: Contact[];
    userMessageId: string;
    config: IContextAssemblyConfig;
}

export class ContextAssemblyPipeline {
    private episodicMemory: EpisodicMemoryModule;
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
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

    async run(params: IContextAssemblyParams) {
        const { conversation, userQuery, mentionedContacts, userMessageId, config } = params;

        const { rows: runRows } = await sql<PipelineRun>`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id, "createdAt";
        `;
        const runId = runRows[0].id;

        try {
            const history = await this.logStep(runId, 1, 'Fetch Episodic Memory', { conversationId: conversation.id, depth: config.episodicMemoryDepth }, () => 
                this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth })
            );

            const semanticMemories = await this.logStep(runId, 2, 'Query Semantic Memory', { query: userQuery, topK: config.semanticMemoryTopK }, () => 
                this.semanticMemory.query({ queryText: userQuery, topK: config.semanticMemoryTopK })
            );

            let contextString = "--- CONTEXT ---\n";
            if (semanticMemories.length > 0) {
                contextString += "Relevant Knowledge:\n" + semanticMemories.map((m: any) => `- ${m.text}`).join('\n') + '\n\n';
            }
            if (mentionedContacts.length > 0) {
                contextString += "Mentioned Contacts:\n" + mentionedContacts.map(c => `- ${c.name}: ${c.notes || c.email}`).join('\n') + '\n\n';
            }
            
            const historyForModel: Content[] = history.map((m: any) => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));
            
            if (contextString.length > 17) { // "--- CONTEXT ---\n".length is 16, so > 17 means something was added
                historyForModel.push({ role: 'user', parts: [{ text: contextString }] });
            }
            historyForModel.push({ role: 'user', parts: [{ text: userQuery }] });

            const modelConfig = {
                temperature: conversation.temperature || undefined,
                topP: conversation.topP || undefined
            };

            const startTime = Date.now();
            const llmResponse = await this.logStep(runId, 3, 'Generate LLM Response', { promptLength: historyForModel.length }, () =>
                llmProvider.generateContent(historyForModel, conversation.systemPrompt || '', modelConfig, conversation.model || undefined)
            );
            const llmResponseTime = Date.now() - startTime;
            
            await sql`
                UPDATE pipeline_runs 
                SET 
                    status = 'completed', 
                    duration_ms = ${Date.now() - new Date(runRows[0].createdAt).getTime()}, 
                    final_output = ${llmResponse},
                    final_llm_prompt = ${historyForModel.map(c => c.parts.map(p => 'text' in p ? p.text : '').join(' ')).join('\n')},
                    final_system_instruction = ${conversation.systemPrompt || ''},
                    model_config_json = ${JSON.stringify(modelConfig)}
                WHERE id = ${runId};
            `;

            return { llmResponse, llmResponseTime };

        } catch (error) {
            await sql`
                UPDATE pipeline_runs SET status = 'failed', duration_ms = ${Date.now() - new Date(runRows[0].createdAt).getTime()}, final_output = ${(error as Error).message} WHERE id = ${runId};
            `;
            console.error("ContextAssemblyPipeline failed:", error);
            throw error;
        }
    }
}
