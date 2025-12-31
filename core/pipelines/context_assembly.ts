
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
                Respond in JSON format: {"reply": "...", "memory": {...}}
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
                    const cleanText = responseText.replace(/```json\n?|```/g, '').trim();
                    const parsed = JSON.parse(cleanText);
                    resultData.reply = parsed.reply;
                    resultData.memory = parsed.memory;
                } catch (e) {
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
