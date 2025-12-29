
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

    private async logStep(runId: string | null, order: number, name: string, input: any, execution: () => Promise<any>) {
        const startTime = Date.now();
        try {
            const output = await execution();
            const duration = Date.now() - startTime;
            if (runId && process.env.POSTGRES_URL) {
                sql`
                    INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "outputPayload", "durationMs", status)
                    VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
                `.catch(e => console.warn(`DB Log Step ${name} failed:`, e.message));
            }
            return output;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            const errorMessage = error.message;
            console.error(`Pipeline step [${name}] failed:`, errorMessage);
            
            if (runId && process.env.POSTGRES_URL) {
                sql`
                    INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "durationMs", status, "errorMessage")
                    VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${duration}, 'failed', ${errorMessage});
                `.catch(e => console.warn(`DB Log Error Step ${name} failed:`, e.message));
            }

            // Fail-safe returns for non-critical retrieval steps
            if (name.includes('Retrieve') || name.includes('Search') || name.includes('Lookup')) {
                if (name.includes('Episodic')) return [];
                if (name.includes('Profile')) return { name: 'User', aiName: 'SoulyCore' };
                return [];
            }
            throw error;
        }
    }

    async run(params: IContextAssemblyParams) {
        const { conversation, userQuery, mentionedContacts, userMessageId, config } = params;
        const brainId = conversation.brainId || null;

        let runId: string | null = null;
        const startTime = Date.now();
        const hasDb = !!process.env.POSTGRES_URL;

        if (hasDb) {
            try {
                const { rows: runRows } = await sql<PipelineRun>`
                    INSERT INTO pipeline_runs ("messageId", "pipelineType", status)
                    VALUES (${userMessageId}, 'ContextAssembly', 'running') RETURNING id;
                `;
                runId = runRows[0].id;
            } catch (e) {
                console.warn("Pipeline Run creation failed:", (e as Error).message);
            }
        }

        try {
            // 1. Episodic Retrieval
            const recentMessages = await this.logStep(runId, 1, 'Retrieve Episodic Memory', { conversationId: conversation.id }, async () => {
                return this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth });
            }) as Message[] || [];
            
            // 2. Profile Retrieval
            const userProfile = await this.logStep(runId, 2, 'Retrieve User Profile', {}, async () => {
                return this.profileMemory.query({});
            }) || { name: 'User', aiName: 'SoulyCore' };

            // 3. Experience Retrieval
            const matchedExperiences = await this.logStep(runId, 3, 'Retrieve Learned Experiences', { userQuery, brainId }, async () => {
                const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                if (queryWords.length === 0) return [];
                try {
                    const { rows } = await db.query(`
                        SELECT * FROM experiences 
                        WHERE "triggerKeywords" && $1::text[]
                        LIMIT 3
                    `, [queryWords]);
                    return rows as Experience[];
                } catch (e) { return []; }
            }) as Experience[] || [];

            // 4. Entity Search (Hybrid: Vector + Keyword)
            const proactiveEntities = await this.logStep(runId, 4, 'Hybrid Search Entities', { userQuery, brainId }, async () => {
                 try {
                     const entities = new Map<string, EntityDefinition>();

                     // A. Vector Search
                     const vectorResults = await this.entityVectorMemory.query({ queryText: userQuery, topK: 5 });
                     if (vectorResults && vectorResults.length > 0) {
                         const ids = vectorResults.map(r => r.id);
                         const { rows } = await db.query(`
                            SELECT * FROM entity_definitions 
                            WHERE id = ANY($1::uuid[]) 
                            AND ("brainId" = $2 OR ("brainId" IS NULL AND $2 IS NULL))
                         `, [ids, brainId]);
                         rows.forEach((r: EntityDefinition) => entities.set(r.id, r));
                     }

                     // B. Keyword Fallback (Direct DB Search)
                     // Searches for entity names that appear in the user query
                     const { rows: keywordRows } = await db.query(`
                        SELECT * FROM entity_definitions
                        WHERE 
                            position(lower(name) in lower($1)) > 0
                            AND ("brainId" = $2 OR ("brainId" IS NULL AND $2 IS NULL))
                        LIMIT 3
                     `, [userQuery, brainId]);
                     
                     keywordRows.forEach((r: EntityDefinition) => entities.set(r.id, r));

                     return Array.from(entities.values());
                 } catch (e) { return []; }
            }) as EntityDefinition[] || [];

            // 5. Graph Lookup
            const graphContext = await this.logStep(runId, 5, 'Graph Memory Lookup', { entities: proactiveEntities.map(e => e.name) }, async () => {
                const relationships = [];
                for (const entity of proactiveEntities) {
                    try {
                        const rels = await this.graphMemory.query({ entityName: entity.name, brainId });
                        if (rels) relationships.push(...rels);
                    } catch (e) { }
                }
                return relationships;
            }) || [];

            // 6. Tool Discovery
            const discoveredTools = await this.logStep(runId, 6, 'Semantic Tool Selection', { userQuery }, async () => {
                try {
                    const { rows: allTools } = await db.query('SELECT name, description FROM tools');
                    return allTools.filter((t: Tool) => 
                        userQuery.toLowerCase().includes(t.name.toLowerCase()) || 
                        t.description.toLowerCase().split(' ').some(word => userQuery.toLowerCase().includes(word))
                    );
                } catch (e) { return []; }
            }) as Tool[] || [];

            // 7. Context Assembly
            const assembledData = await this.logStep(runId, 7, 'Assemble Final Prompt', {}, () => {
                let context = `
=== IDENTITY & PREFERENCES ===
Your Name: ${userProfile.aiName || 'SoulyCore'}
User Name: ${userProfile.name || 'User'}
Communication Style: ${userProfile.preferences?.join(', ') || 'Helpful Assistant'}
Role/Persona: ${userProfile.role || 'Assistant'}

=== RELEVANT EXPERIENCES ===
${matchedExperiences.map(exp => `- Goal: "${exp.goalTemplate}" -> Solution: ${JSON.stringify(exp.stepsJson)}`).join('\n') || 'None'}

=== KNOWLEDGE ENTITIES ===
${proactiveEntities.map(e => `- ${e.name} (${e.type}): ${e.description}`).join('\n') || 'None'}

=== GRAPH RELATIONSHIPS ===
${graphContext.join('\n') || 'None'}
`;
                const finalInstruction = `${conversation.systemPrompt || "You are a helpful AI assistant."}\n\nUSE THE FOLLOWING CONTEXT TO INFORM YOUR RESPONSE:\n${context}`;
                
                const existingIds = new Set(recentMessages.map(m => m.id));
                const formattedHistory = recentMessages.map(m => ({
                    role: m.role as 'user' | 'model',
                    parts: [{ text: m.content || "" }]
                }));
                
                if (!existingIds.has(userMessageId)) {
                    formattedHistory.push({ role: 'user', parts: [{ text: userQuery }] });
                }
                
                return Promise.resolve({ systemInstruction: finalInstruction, history: formattedHistory });
            });

            const { systemInstruction, history } = assembledData;

            // 8. LLM Execution
            let llmResponse = "";
            try {
                llmResponse = await llmProvider.generateContent(
                    history, 
                    systemInstruction, 
                    { temperature: conversation.temperature }, 
                    conversation.model || undefined
                );
            } catch (llmError: any) {
                console.error("LLM Execution Failed:", llmError.message);
                throw new Error(`LLM Generation Failed: ${llmError.message}`);
            }
            
            if (runId && hasDb) {
                const totalDuration = Date.now() - startTime;
                sql`
                    UPDATE pipeline_runs 
                    SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${llmResponse}
                    WHERE id = ${runId};
                `.catch(e => console.warn("Failed to update pipeline run status:", e.message));
            }
            
            return { 
                llmResponse, 
                llmResponseTime: Date.now() - startTime,
                metadata: {
                    semantic: matchedExperiences,
                    structured: proactiveEntities, // Returns actual array
                    graph: graphContext, // Returns actual array
                    episodic: recentMessages.map(m => ({role: m.role, content: m.content.substring(0, 50) + '...'})) // Return summarized message objects
                }
            };

        } catch (error: any) {
             const finalErrorMessage = error.message;
             console.error("Critical ContextAssembly failure:", finalErrorMessage);
             if (runId && hasDb) {
                 const totalDuration = Date.now() - startTime;
                 sql`UPDATE pipeline_runs SET status = 'failed', "durationMs" = ${totalDuration}, "finalOutput" = ${finalErrorMessage} WHERE id = ${runId};`.catch(() => {});
             }
             throw error;
        }
    }
}
