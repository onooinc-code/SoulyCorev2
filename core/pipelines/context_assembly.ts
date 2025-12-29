
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
    // New param to control output mode
    executionMode?: 'dual_output' | 'response_only';
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

    async run(params: IContextAssemblyParams) {
        const { conversation, userQuery, mentionedContacts, userMessageId, config, executionMode = 'dual_output' } = params;
        const brainId = conversation.brainId || null;
        let runId: string | null = null;
        const startTime = Date.now();

        await this.logToSystem(`[Pipeline] Context Assembly Initiated`, { userQuery, executionMode });

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

            let finalInstruction = '';

            if (executionMode === 'dual_output') {
                 // --- SINGLE-SHOT MODE (ORIGINAL) ---
                 finalInstruction = `
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
            } else {
                 // --- RESPONSE ONLY MODE (BACKGROUND EXTRACTION) ---
                 finalInstruction = `
                 ${conversation.systemPrompt || "You are a helpful AI assistant."}
                 
                 ${context}
                 
                 Instructions:
                 1. Answer the user's request naturally and helpfully.
                 2. Do NOT output JSON. Just output the text response.
                 `;
            }
            
            const history = recentMessages.map(m => ({
                role: m.role as 'user' | 'model',
                parts: [{ text: m.content || "" }]
            }));
            
            // Add current message
            history.push({ role: 'user', parts: [{ text: userQuery }] });

            // 3. Call LLM
            await this.logToSystem(`[Pipeline] Calling LLM (${executionMode})`);
            
            // Note: If dual_output, we ideally want to enforce JSON mode via config, but doing it via prompt is often enough for Gemini 1.5/2.0
            const responseText = await llmProvider.generateContent(
                history, 
                finalInstruction, 
                { temperature: conversation.temperature },
                conversation.model || undefined
            );

            // 4. Output Processing
            let resultData: { reply: string, memory: any } = { reply: '', memory: null };

            if (executionMode === 'dual_output') {
                try {
                    const cleanText = responseText.replace(/```json\n?|```/g, '').trim();
                    const parsed = JSON.parse(cleanText);
                    resultData.reply = parsed.reply;
                    resultData.memory = parsed.memory;
                } catch (e) {
                    console.error("JSON Parse Error in Dual Output:", responseText);
                    // Fallback
                    resultData.reply = responseText;
                    resultData.memory = {};
                }
            } else {
                resultData.reply = responseText;
                resultData.memory = null; // Memory extraction will happen in background
            }

            if (runId) {
                const totalDuration = Date.now() - startTime;
                // For logging, we save what we got
                const outputLog = executionMode === 'dual_output' ? JSON.stringify(resultData) : JSON.stringify({ reply: "Text Response Generated (See Message)"});
                sql`
                    UPDATE pipeline_runs 
                    SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${outputLog}
                    WHERE id = ${runId};
                `.catch(() => {});
            }

            return { 
                llmResponse: resultData.reply, 
                extractedMemory: resultData.memory,
                llmResponseTime: Date.now() - startTime,
                metadata: { structured: proactiveEntities }
            };

        } catch (error: any) {
             console.error("Pipeline Critical Failure:", error);
             throw error;
        }
    }
}
