import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '@/core/llm';
import { sql } from '@/lib/db';
import type { Conversation, Contact, PipelineRun, Message } from '@/lib/types';
import { IContextAssemblyConfig } from '../memory/types';

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

    private async logStep(runId: string, order: number, name: string, input: any, execution: () => Promise<any>, modelUsed?: string, promptUsed?: string, configUsed?: any) {
        const startTime = Date.now();
        try {
            const output = await execution();
            const duration = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps (run_id, step_order, step_name, input_payload, output_payload, duration_ms, status, model_used, prompt_used, config_used)
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed', ${modelUsed || null}, ${promptUsed || null}, ${configUsed ? JSON.stringify(configUsed) : null});
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
            VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id;
        `;
        const runId = runRows[0].id;
        const startTime = Date.now();

        try {
            // Step 1: Retrieve Episodic Memory (Recent Conversation History)
            const recentMessages = await this.logStep(runId, 1, 'Retrieve Episodic Memory', { conversationId: conversation.id, depth: config.episodicMemoryDepth }, () =>
                this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth })
            ) as Message[];

            // Step 2: Retrieve Semantic Memory (Relevant Knowledge)
            const semanticResults = await this.logStep(runId, 2, 'Retrieve Semantic Memory', { userQuery, topK: config.semanticMemoryTopK }, () =>
                conversation.useSemanticMemory
                    ? this.semanticMemory.query({ queryText: userQuery, topK: config.semanticMemoryTopK })
                    : Promise.resolve([])
            ) as ISemanticQueryResult[];

            // Step 3: Retrieve Structured Memory (Mentioned Contacts)
            // The mentionedContacts are already passed in, so this is about formatting.
            const structuredContext = await this.logStep(runId, 3, 'Format Structured Memory', { mentionedContacts }, () =>
                 (conversation.useStructuredMemory && mentionedContacts.length > 0)
                    ? mentionedContacts.map(c => `Contact: ${c.name} - ${c.notes || c.email || 'No details'}`).join('\n')
                    : Promise.resolve("")
            ) as string;

            // Step 4: Assemble the final prompt components
            const { systemInstruction, history } = await this.logStep(runId, 4, 'Assemble Context', { semanticResults, structuredContext, recentMessages }, () => {
                let contextBlock = "";
                if (semanticResults.length > 0) {
                    contextBlock += "--- Relevant Knowledge ---\n";
                    contextBlock += semanticResults.map(r => r.text).join('\n');
                    contextBlock += "\n--------------------------\n";
                }
                if (structuredContext) {
                    contextBlock += "--- Mentioned Contacts ---\n";
                    contextBlock += structuredContext;
                    contextBlock += "\n--------------------------\n";
                }

                const finalSystemInstruction = `${conversation.systemPrompt || 'You are a helpful AI assistant.'}\n\n${contextBlock}`;
                
                const formattedHistory = recentMessages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.content }]
                }));
                // Add the current user query to the history for the LLM call
                formattedHistory.push({ role: 'user', parts: [{ text: userQuery }] });

                return Promise.resolve({ systemInstruction: finalSystemInstruction, history: formattedHistory });
            });
            
            const modelConfig = {
                temperature: conversation.temperature || 0.7,
                topP: conversation.topP || 0.95,
            };

            // Step 5: Call the LLM
            const llmResponse = await this.logStep(
                runId,
                5,
                'Generate LLM Response',
                { historyLength: history.length },
                () => llmProvider.generateContent(history, systemInstruction, modelConfig, conversation.model || undefined),
                conversation.model || 'default',
                "History provided in payload",
                modelConfig
            );

            const llmResponseTime = Date.now() - startTime;
            
            await sql`
                UPDATE pipeline_runs 
                SET 
                    status = 'completed', 
                    duration_ms = ${llmResponseTime}, 
                    final_output = ${llmResponse},
                    final_llm_prompt = ${history[history.length - 1].parts[0].text},
                    final_system_instruction = ${systemInstruction},
                    model_config_json = ${JSON.stringify(modelConfig)}
                WHERE id = ${runId};
            `;
            
            return { llmResponse, llmResponseTime };

        } catch (error) {
            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'failed', duration_ms = ${totalDuration}, final_output = ${(error as Error).message} WHERE id = ${runId};
            `;
            console.error("ContextAssemblyPipeline failed:", error);
            throw error;
        }
    }
}
