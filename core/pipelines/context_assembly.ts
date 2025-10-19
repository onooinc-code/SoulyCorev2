import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '../llm';
import { sql } from '@/lib/db';
import type { Conversation, Contact, Message, PipelineRun } from '@/lib/types';
import { IContextAssemblyConfig } from '../memory/types';
import { HistoryContent } from '../llm/types';

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

    async run(params: IContextAssemblyParams): Promise<{ llmResponse: string; llmResponseTime: number; }> {
        const { conversation, userQuery, mentionedContacts, userMessageId, config } = params;
        const startTime = Date.now();
        
        const { rows: runRows } = await sql<PipelineRun>`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id;
        `;
        const runId = runRows[0].id;

        try {
            // 1. Retrieve Episodic Memory
            const recentMessages = await this.logStep(runId, 1, 'Retrieve Episodic Memory', { conversationId: conversation.id, depth: config.episodicMemoryDepth }, () => 
                this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth })
            ) as Message[];

            // 2. Retrieve Semantic Memory
            const semanticContext = await this.logStep(runId, 2, 'Retrieve Semantic Memory', { query: userQuery, topK: config.semanticMemoryTopK }, () => 
                 conversation.useSemanticMemory ? this.semanticMemory.query({ queryText: userQuery, topK: config.semanticMemoryTopK }) : Promise.resolve([])
            ) as ISemanticQueryResult[];

            // 3. Retrieve Structured Memory (Contacts)
            const structuredContext = await this.logStep(runId, 3, 'Retrieve Structured Memory', { contacts: mentionedContacts.map(c => c.name) }, () =>
                Promise.resolve(mentionedContacts)
            ) as Contact[];

            // 4. Assemble Final Prompt
            const { systemInstruction, history } = await this.logStep(runId, 4, 'Assemble Prompt', { recentMessages, semanticContext, structuredContext, userQuery }, () => 
                this.assemblePrompt(conversation, recentMessages, semanticContext, structuredContext, userQuery)
            );
            
            // 5. Call LLM
            const llmStartTime = Date.now();
            const llmResponse = await this.logStep(runId, 5, 'Call LLM', { systemInstruction, historyLength: history.length }, () =>
                llmProvider.generateContent(history, systemInstruction, { temperature: conversation.temperature, topP: conversation.topP }, conversation.model)
            ) as string;
            const llmResponseTime = Date.now() - llmStartTime;
            
            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs
                SET status = 'completed', duration_ms = ${totalDuration}, final_output = ${llmResponse},
                    final_llm_prompt = ${JSON.stringify(history.map(h => h.parts))},
                    final_system_instruction = ${systemInstruction},
                    model_config_json = ${JSON.stringify({ model: conversation.model, temperature: conversation.temperature, topP: conversation.topP })}
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

    // FIX: Made this an async function to ensure it returns a Promise, satisfying the type required by the `logStep` utility.
    private async assemblePrompt(conversation: Conversation, recentMessages: Message[], semanticContext: ISemanticQueryResult[], structuredContext: Contact[], userQuery: string) {
        const systemInstructionParts: string[] = [];
        if (conversation.systemPrompt) {
            systemInstructionParts.push(conversation.systemPrompt);
        }

        if (conversation.useStructuredMemory && structuredContext.length > 0) {
            systemInstructionParts.push("CONTEXT on relevant people/entities:");
            structuredContext.forEach(contact => {
                systemInstructionParts.push(`- ${contact.name}: ${contact.notes || 'No notes'}`);
            });
        }

        if (conversation.useSemanticMemory && semanticContext.length > 0) {
            systemInstructionParts.push("CONTEXT from knowledge base:");
            semanticContext.forEach(item => {
                systemInstructionParts.push(`- ${item.text}`);
            });
        }

        const systemInstruction = systemInstructionParts.join('\n\n');
        
        const history: HistoryContent[] = recentMessages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content_summary || msg.content }]
        }));

        history.push({ role: 'user', parts: [{ text: userQuery }] });

        return { systemInstruction, history };
    }
}