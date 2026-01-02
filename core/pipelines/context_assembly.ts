
// core/pipelines/context_assembly.ts
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { GraphMemoryModule } from '../memory/modules/graph';
import { ProfileMemoryModule } from '../memory/modules/profile';
import llmProvider from '@/core/llm';
import { db, sql } from '@/lib/db';
import type { Conversation, Contact, PipelineRun } from '@/lib/types';
import { IContextAssemblyConfig } from '../memory/types';

interface IContextAssemblyParams {
    conversation: Conversation;
    userQuery: string;
    mentionedContacts: Contact[];
    userMessageId: string;
    config: IContextAssemblyConfig;
    executionMode?: 'dual_output' | 'response_only';
}

export class ContextAssemblyPipeline {
    private episodicMemory: EpisodicMemoryModule;
    private semanticMemory: SemanticMemoryModule;
    private entityVectorMemory: EntityVectorMemoryModule;
    private graphMemory: GraphMemoryModule;
    private profileMemory: ProfileMemoryModule;

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        this.graphMemory = new GraphMemoryModule();
        this.profileMemory = new ProfileMemoryModule();
    }

    private async logToSystem(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
        try {
            await sql`INSERT INTO logs (message, payload, level, timestamp) VALUES (${message}, ${JSON.stringify(payload)}, ${level}, NOW());`;
        } catch (e) {}
    }

    async run(params: IContextAssemblyParams) {
        const { conversation, userQuery, userMessageId, config, executionMode = 'dual_output' } = params;
        const startTime = Date.now();
        let runId: string | null = null;

        if (process.env.POSTGRES_URL) {
            try {
                const { rows } = await sql<PipelineRun>`INSERT INTO pipeline_runs ("messageId", "pipelineType", status) VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id;`;
                runId = rows[0].id;
                await this.logToSystem(`[Context] Pipeline started for message: ${userMessageId}`, { query: userQuery });
            } catch (e) {}
        }

        try {
            // 1. Contextual Query Expansion
            const recentMessages = await this.episodicMemory.query({ conversationId: conversation.id, limit: 5 });
            const contextForSearch = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
            
            const searchGenerationPrompt = `Based on the following conversation and the new message, generate a 3-word search query to retrieve relevant entities from long-term memory.
            Context:
            ${contextForSearch}
            New Message: "${userQuery}"
            Search Query:`;
            
            const expandedQuery = await llmProvider.generateContent([], searchGenerationPrompt, { temperature: 0.1 });
            await this.logToSystem(`[Context] Query Expanded`, { original: userQuery, expanded: expandedQuery });

            // 2. Parallel Retrieval across all 4 tiers
            const [userProfile, proactiveEntities, semanticKnowledge, graphRelationships] = await Promise.all([
                this.profileMemory.query({}),
                // Tier: Structured (Postgres + Upstash)
                this.entityVectorMemory.query({ queryText: expandedQuery, topK: 5 }).then(async (vecResults) => {
                     if (!vecResults.length) return [];
                     const ids = vecResults.map(r => r.id);
                     const { rows } = await db.query(`SELECT * FROM entity_definitions WHERE id = ANY($1::uuid[])`, [ids]);
                     return rows;
                }).catch(() => []),
                // Tier: Semantic (Pinecone)
                this.semanticMemory.query({ queryText: expandedQuery, topK: 3 }).catch(() => []),
                // Tier: Graph (EdgeDB)
                this.graphMemory.query({ entityName: expandedQuery.split(' ')[0], brainId: conversation.brainId }).catch(() => [])
            ]);
            
            await this.logToSystem(`[Context] Retrieval Complete`, { 
                entitiesFound: proactiveEntities.length,
                factsFound: semanticKnowledge.length,
                graphPaths: graphRelationships.length
            });

            // 3. Assemble Final Prompt
            const memoryContext = `
=== SHARED MEMORY (ENTITIES) ===
${proactiveEntities.map((e: any) => `- ${e.name} (${e.type}): ${e.description}`).join('\n') || 'No entities found.'}

=== RELATIONSHIP GRAPH ===
${graphRelationships.length > 0 ? graphRelationships.join('\n') : 'No graph paths found.'}

=== GLOBAL KNOWLEDGE ===
${semanticKnowledge.map((k: any) => `- ${k.text}`).join('\n') || 'No facts found.'}

=== USER PROFILE ===
Name: ${userProfile.name}
Preferences: ${JSON.stringify(userProfile.preferences)}
`;

            const finalInstruction = executionMode === 'dual_output' ? `
                ${conversation.systemPrompt}
                ${memoryContext}
                
                IMPORTANT: You must respond in a valid JSON format only. Do not add any text outside the JSON block.
                Structure:
                {
                    "reply": "Your response to the user here...",
                    "memory": {
                        "entities": [],
                        "facts": [],
                        "userProfileUpdates": {}
                    }
                }
            ` : `
                ${conversation.systemPrompt}
                ${memoryContext}
                Respond with plain text.
            `;

            const history = recentMessages.map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content || "" }] }));
            history.push({ role: 'user', parts: [{ text: userQuery }] });

            const responseText = await llmProvider.generateContent(history, finalInstruction, { temperature: conversation.temperature }, conversation.model);

            let resultData = { reply: responseText, memory: null };
            
            if (executionMode === 'dual_output') {
                try {
                    // ROBUST PARSING LOGIC:
                    // 1. Try to find a JSON block between ```json and ```
                    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
                    let jsonStr = "";
                    
                    if (jsonMatch && jsonMatch[1]) {
                        jsonStr = jsonMatch[1];
                    } else {
                        // 2. If no code block, try to find the first '{' and last '}'
                        const firstBrace = responseText.indexOf('{');
                        const lastBrace = responseText.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace !== -1) {
                            jsonStr = responseText.substring(firstBrace, lastBrace + 1);
                        }
                    }

                    if (jsonStr) {
                        const parsed = JSON.parse(jsonStr);
                        // If we successfully parsed, USE ONLY THE 'reply' field for the user.
                        if (parsed.reply) {
                            resultData.reply = parsed.reply;
                            resultData.memory = parsed.memory || null;
                        } else {
                             // Fallback: If parse valid but no reply field, assume structural error
                             // and keep raw text, but log it.
                             console.warn("Parsed JSON but 'reply' field missing.");
                             resultData.reply = responseText; 
                        }
                    } else {
                        // Fallback: No JSON structure found at all.
                        resultData.reply = responseText;
                    }
                } catch (e) {
                    console.error("Failed to parse dual_output JSON", e);
                    // On error, we default to showing the full text, assuming the model failed the instruction.
                    resultData.reply = responseText;
                }
            }

            if (runId) {
                const totalDuration = Date.now() - startTime;
                await sql`UPDATE pipeline_runs SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${JSON.stringify(resultData)} WHERE id = ${runId};`;
            }

            return { 
                llmResponse: resultData.reply, 
                extractedMemory: resultData.memory,
                llmResponseTime: Date.now() - startTime,
                metadata: { 
                    semantic: semanticKnowledge, 
                    structured: proactiveEntities, 
                    episodic: recentMessages,
                    graph: graphRelationships
                }
            };

        } catch (error: any) {
             await this.logToSystem(`[Pipeline] Failure`, { error: error.message }, 'error');
             throw error;
        }
    }
}
