
// core/pipelines/context_assembly.ts
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { GraphMemoryModule } from '../memory/modules/graph';
import { ProfileMemoryModule } from '../memory/modules/profile';
import llmProvider from '@/core/llm';
import { db, sql } from '@/lib/db';
import type { Conversation, Contact, PipelineRun, Message, EntityDefinition, Experience, Tool } from '@/lib/types';
import { IContextAssemblyConfig } from '../memory/types';
import { Type } from '@google/genai';

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
    private entityVectorMemory: EntityVectorMemoryModule;
    private graphMemory: GraphMemoryModule;
    private profileMemory: ProfileMemoryModule;

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        this.graphMemory = new GraphMemoryModule();
        this.profileMemory = new ProfileMemoryModule();
    }

    private async logToSystem(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
        if (!process.env.POSTGRES_URL) return;
        try {
            await sql`
                INSERT INTO logs (message, payload, level, timestamp) 
                VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level}, NOW());
            `;
        } catch (e) { console.warn("Failed to write to system log:", e); }
    }

    private async logStep(runId: string | null, order: number, name: string, input: any, execution: () => Promise<any>) {
        const startTime = Date.now();
        await this.logToSystem(`[Pipeline] Step: ${name}`, { runId });

        try {
            const output = await execution();
            const duration = Date.now() - startTime;
            
            if (runId && process.env.POSTGRES_URL) {
                sql`
                    INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "outputPayload", "durationMs", status)
                    VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
                `.catch(() => {});
            }
            return output;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            if (runId && process.env.POSTGRES_URL) {
                sql`
                    INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "durationMs", status, "errorMessage")
                    VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${duration}, 'failed', ${error.message});
                `.catch(() => {});
            }
            if (name.includes('Retrieve') || name.includes('Search')) return [];
            throw error;
        }
    }

    async run(params: IContextAssemblyParams) {
        const { conversation, userQuery, mentionedContacts, userMessageId, config } = params;
        const brainId = conversation.brainId || null;
        let runId: string | null = null;
        const startTime = Date.now();

        await this.logToSystem(`[Pipeline] Context Assembly Initiated`, { userQuery });

        if (process.env.POSTGRES_URL) {
            try {
                const { rows: runRows } = await sql<PipelineRun>`
                    INSERT INTO pipeline_runs ("messageId", "pipelineType", status)
                    VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id;
                `;
                runId = runRows[0].id;
            } catch (e) {}
        }

        try {
            // 1. Retrieval Steps (Parallelized for speed)
            const [recentMessages, userProfile, proactiveEntities] = await Promise.all([
                this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth }),
                this.profileMemory.query({}),
                this.entityVectorMemory.query({ queryText: userQuery, topK: 3 }).then(async (vecResults) => {
                     if (!vecResults.length) return [];
                     const ids = vecResults.map(r => r.id);
                     const { rows } = await db.query(`SELECT * FROM entity_definitions WHERE id = ANY($1::uuid[])`, [ids]);
                     return rows;
                }).catch(() => [])
            ]);

            // 2. Assemble Context
            const context = `
=== IDENTITY ===
User: ${userProfile.name || 'User'}
AI Name: ${userProfile.aiName || 'SoulyCore'}
Role: ${userProfile.role || 'Assistant'}

=== RELEVANT KNOWLEDGE ===
${proactiveEntities.map((e: any) => `- ${e.name} (${e.type}): ${e.description}`).join('\n') || 'None'}
`;

            const finalInstruction = `
            ${conversation.systemPrompt || "You are a helpful AI assistant."}
            
            ${context}

            IMPORTANT INSTRUCTION:
            You must respond in a specific JSON format. Do not output plain text.
            
            JSON Structure:
            {
                "reply": "Your natural language response to the user here (use Markdown if needed)",
                "memory": {
                    "entities": [ { "name": "Name", "type": "Type", "description": "Description" } ],
                    "facts": [ "Fact 1", "Fact 2" ],
                    "userProfileUpdates": { "name": "...", "preference": "..." }
                }
            }

            Tasks:
            1. Answer the user's request in the "reply" field.
            2. Simultaneously, extract any NEW entities, facts, or user preferences found in this turn into the "memory" field.
            3. If nothing new to memorize, "memory" arrays should be empty.
            `;
            
            const history = recentMessages.map(m => ({
                role: m.role as 'user' | 'model',
                parts: [{ text: m.content || "" }]
            }));
            
            // Add current message
            history.push({ role: 'user', parts: [{ text: userQuery }] });

            // 3. One-Shot Generation
            await this.logToSystem(`[Pipeline] Calling LLM (Single-Shot Mode)`);
            
            // We use the raw client here to access the JSON mode configuration
            // forcing the LLM to adhere to the schema in one go.
            const responseText = await llmProvider.generateContent(
                history, 
                finalInstruction, 
                { temperature: conversation.temperature },
                conversation.model || undefined
            );

            // 4. Parse the Dual Output
            let parsedOutput;
            try {
                // Remove markdown code blocks if present
                const cleanText = responseText.replace(/```json\n?|```/g, '').trim();
                parsedOutput = JSON.parse(cleanText);
            } catch (e) {
                console.error("JSON Parse Error:", responseText);
                // Fallback if model fails to output JSON (rare with this prompt)
                parsedOutput = { reply: responseText, memory: {} };
            }

            if (runId) {
                const totalDuration = Date.now() - startTime;
                sql`
                    UPDATE pipeline_runs 
                    SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${JSON.stringify(parsedOutput)}
                    WHERE id = ${runId};
                `.catch(() => {});
            }

            return { 
                llmResponse: parsedOutput.reply || "Error: No reply generated.", 
                extractedMemory: parsedOutput.memory || {},
                llmResponseTime: Date.now() - startTime,
                metadata: { structured: proactiveEntities }
            };

        } catch (error: any) {
             console.error("Pipeline Critical Failure:", error);
             throw error;
        }
    }
}
