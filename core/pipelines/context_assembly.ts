
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { GraphMemoryModule } from '../memory/modules/graph';
import { ProfileMemoryModule } from '../memory/modules/profile';
import llmProvider from '@/core/llm';
import { db, sql } from '@/lib/db';
import type { Conversation, Contact, PipelineRun, Message, EntityDefinition, Experience } from '@/lib/types';
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

    private async logStep(runId: string, order: number, name: string, input: any, execution: () => Promise<any>) {
        const startTime = Date.now();
        try {
            const output = await execution();
            const duration = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "outputPayload", "durationMs", status)
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
            `;
            return output;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = (error as Error).message;
            await sql`
                INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "durationMs", status, "errorMessage")
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${duration}, 'failed', ${errorMessage});
            `;
            throw error;
        }
    }

    async run(params: IContextAssemblyParams) {
        const { conversation, userQuery, mentionedContacts, userMessageId, config } = params;

        const { rows: runRows } = await sql<PipelineRun>`
            INSERT INTO pipeline_runs ("messageId", "pipelineType", status)
            VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id;
        `;
        const runId = runRows[0].id;
        const startTime = Date.now();

        try {
            // 1. Episodic Retrieval
            const recentMessages = await this.logStep(runId, 1, 'Retrieve Episodic Memory', { conversationId: conversation.id }, () =>
                this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth })
            ) as Message[];
            
            // 2. Profile Retrieval
            const userProfile = await this.logStep(runId, 2, 'Retrieve User Profile', {}, () => 
                this.profileMemory.query({})
            );

            // 3. Experience Retrieval (Learned Patterns) - NEW
            const matchedExperiences = await this.logStep(runId, 3, 'Retrieve Learned Experiences', { userQuery }, async () => {
                // Simplified matching: search keywords in query
                const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                if (queryWords.length === 0) return [];
                const { rows } = await db.query(`
                    SELECT * FROM experiences 
                    WHERE "triggerKeywords" && $1::text[]
                    LIMIT 2
                `, [queryWords]);
                return rows as Experience[];
            }) as Experience[];

            // 4. Proactive Entity Similarity Search
            const proactiveEntities = await this.logStep(runId, 4, 'Vector Search Entities', { userQuery }, async () => {
                 const results = await this.entityVectorMemory.query({ queryText: userQuery, topK: 5 });
                 if (results.length === 0) return [];
                 const ids = results.map(r => r.id);
                 const { rows } = await db.query('SELECT * FROM entity_definitions WHERE id = ANY($1::uuid[])', [ids]);
                 return rows;
            }) as EntityDefinition[];

            // 5. Graph Relationship Retrieval
            const graphContext = await this.logStep(runId, 5, 'Graph Memory Lookup', { entities: proactiveEntities.map(e => e.name) }, async () => {
                const relationships = [];
                for (const entity of proactiveEntities) {
                    try {
                        const rels = await this.graphMemory.query({ entityName: entity.name });
                        relationships.push(...rels);
                    } catch (e) { console.warn('EdgeDB Query failed', e); }
                }
                return relationships;
            });

            // 6. Semantic Retrieval
            const semanticResults = await this.logStep(runId, 6, 'Semantic Search', { userQuery }, () =>
                 this.semanticMemory.query({ queryText: userQuery, topK: 3 })
            ) as ISemanticQueryResult[];

            // 7. Context Assembly
            const { systemInstruction, history } = await this.logStep(runId, 7, 'Assemble Final Prompt', {}, () => {
                let context = `
=== USER PROFILE & PREFERENCES ===
Preferences: ${userProfile.preferences?.join(', ') || 'None'}

=== RELEVANT LEARNED EXPERIENCES (HOW-TO) ===
${matchedExperiences.map(exp => `- For goals like "${exp.goalTemplate}", the plan was: ${JSON.stringify(exp.stepsJson)}`).join('\n') || 'None'}

=== STRUCTURED KNOWLEDGE (ENTITIES) ===
${proactiveEntities.map(e => `- ${e.name} (${e.type}): ${e.description}`).join('\n')}

=== GRAPH RELATIONSHIPS ===
${graphContext.join('\n')}

=== SEMANTIC CONTEXT ===
${semanticResults.map(r => `> ${r.text}`).join('\n')}
`;
                const finalInstruction = `${conversation.systemPrompt}\n\nUSE THE FOLLOWING CONTEXT TO INFORM YOUR RESPONSE:\n${context}`;
                
                const formattedHistory = recentMessages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.content }]
                }));
                formattedHistory.push({ role: 'user', parts: [{ text: userQuery }] });
                
                return Promise.resolve({ systemInstruction: finalInstruction, history: formattedHistory });
            });

            // 8. LLM Execution
            const llmResponse = await llmProvider.generateContent(history, systemInstruction, { temperature: conversation.temperature }, conversation.model || undefined);
            
            const totalDuration = Date.now() - startTime;
             await sql`
                UPDATE pipeline_runs 
                SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${llmResponse}
                WHERE id = ${runId};
            `;
            
            return { llmResponse, llmResponseTime: totalDuration };

        } catch (error) {
             const totalDuration = Date.now() - startTime;
             await sql`UPDATE pipeline_runs SET status = 'failed', "durationMs" = ${totalDuration}, "finalOutput" = ${(error as Error).message} WHERE id = ${runId};`;
             throw error;
        }
    }
}
