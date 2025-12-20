
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { EntityVectorMemoryModule, IVectorQueryResult } from '../memory/modules/entity_vector';
import llmProvider from '@/core/llm';
import { db, sql } from '@/lib/db';
// FIX: Corrected import paths for types.
import type { Conversation, Contact, PipelineRun, Message, EntityDefinition } from '@/lib/types';
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

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
    }

    private async logStep(runId: string, order: number, name: string, input: any, execution: () => Promise<any>, modelUsed?: string, promptUsed?: string, configUsed?: any) {
        const startTime = Date.now();
        try {
            const output = await execution();
            const duration = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps ("runId", "stepOrder", "stepName", "inputPayload", "outputPayload", "durationMs", status, "modelUsed", "promptUsed", "configUsed")
                VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed', ${modelUsed || null}, ${promptUsed || null}, ${configUsed ? JSON.stringify(configUsed) : null});
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
    
    private async updateEntitySalience(entityIds: string[]): Promise<void> {
        if (entityIds.length === 0) return;
        try {
            // FIX: The @vercel/postgres `sql` template literal has strict typings that do not correctly handle array parameters for `ANY()` clauses, causing a build failure.
            // The `entityIds` array has been cast to `any` to bypass this type checking issue, which is the recommended workaround as the runtime correctly handles the array.
            await sql`
                UPDATE entity_definitions
                SET "accessCount" = "accessCount" + 1, "lastAccessedAt" = CURRENT_TIMESTAMP
                WHERE id = ANY(${entityIds as any}::uuid[]);
            `;
        } catch (error) {
            // Log this error but don't let it crash the main pipeline
            console.error("Background salience update failed:", error);
        }
    }


    private async extractPotentialNames(query: string): Promise<string[]> {
        try {
            const prompt = `From the following text, extract all proper nouns or terms that could be named entities (people, places, projects). Return them as a valid JSON array of strings. Do not include common words. If no entities are found, return an empty array [].

Text: "${query}"

Respond with ONLY the JSON array.`;

            const responseJson = await llmProvider.generateContent(
                [{ role: 'user', parts: [{ text: prompt }] }],
                "You are a JSON-outputting named entity recognizer."
            );
            
            if (!responseJson) return [];

            // Clean up markdown code blocks if the model adds them
            const cleanedJson = responseJson.replace(/```json|```/g, '').trim();
            const names = JSON.parse(cleanedJson);
            if (Array.isArray(names)) {
                return names.filter(name => typeof name === 'string' && name.length > 1);
            }
            return [];
        } catch (error) {
            console.error("Failed to extract potential names:", error);
            return []; // Gracefully fail
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
            // Step 1: Retrieve Episodic Memory (Recent Conversation History)
            const recentMessages = await this.logStep(runId, 1, 'Retrieve Episodic Memory', { conversationId: conversation.id, depth: config.episodicMemoryDepth }, () =>
                this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth })
            ) as Message[];
            
            // Step 2: Disambiguate Entities
            const disambiguationInstruction = await this.logStep(runId, 2, 'Disambiguate Entities', { userQuery, brainId: conversation.brainId }, async () => {
                const potentialNames = await this.extractPotentialNames(userQuery);
                if (potentialNames.length === 0) return '';

                for (const name of potentialNames) {
                    let matchingEntitiesRows;
                    if (conversation.brainId) {
                        ({ rows: matchingEntitiesRows } = await sql<EntityDefinition>`
                            SELECT id, name, type FROM entity_definitions 
                            WHERE name ILIKE ${name} AND "brainId" = ${conversation.brainId}
                        `);
                    } else {
                        ({ rows: matchingEntitiesRows } = await sql<EntityDefinition>`
                            SELECT id, name, type FROM entity_definitions 
                            WHERE name ILIKE ${name} AND "brainId" IS NULL
                        `);
                    }

                    if (matchingEntitiesRows.length > 1) {
                        const options = matchingEntitiesRows.map(e => `'${e.name} (${e.type})'`).join(' or ');
                        return `CRITICAL INSTRUCTION: Before answering the user's query, you MUST first ask a clarifying question. The term '${name}' is ambiguous. Ask the user to clarify which of these they mean: ${options}. Your entire response must ONLY be this clarification question. Do not answer the original query yet.`;
                    }
                }
                return '';
            });


            // Step 3: Proactive Entity Retrieval with Enhanced Salience
            const proactiveEntities = await this.logStep(runId, 3, 'Proactive Entity Retrieval w/ Salience', { userQuery, topK: 3, candidates: 15 }, async () => {
                if (!conversation.useStructuredMemory) return [];
            
                // 1. Fetch more candidates from vector search to allow for re-ranking
                const vectorResults: IVectorQueryResult[] = await this.entityVectorMemory.query({ queryText: userQuery, topK: 15 });
                if (vectorResults.length === 0) return [];
            
                const entityIds = vectorResults.map(e => e.id);
                const vectorScores = new Map(vectorResults.map(e => [e.id, e.score]));
            
                // 2. Fetch full entity details including salience data
                // FIX: Removed the generic type argument from `db.query`. The wrapper function in `lib/db.ts` is not generic.
                const { rows: candidateEntities } = await db.query(
                    'SELECT * FROM entity_definitions WHERE id = ANY($1::uuid[])',
                    [entityIds]
                );
            
                // 3. Calculate salience and re-rank
                // Formula: FinalScore = VectorMatch * (1 + RecencyBoost + FrequencyBoost)
                const now = new Date().getTime();
                const rankedEntities = candidateEntities.map(entity => {
                    const vectorScore = vectorScores.get(entity.id) || 0;
                    
                    // Recency Boost: Higher boost for very recent access (decay over 7 days)
                    const lastAccessed = entity.lastAccessedAt ? new Date(entity.lastAccessedAt).getTime() : now - (1000 * 3600 * 24 * 30);
                    const hoursSinceAccess = (now - lastAccessed) / (1000 * 3600);
                    const recencyWeight = 1 / (1 + Math.log(1 + hoursSinceAccess)); // Decays quickly then flattens
            
                    // Frequency Boost: Logarithmic scale to prevent old frequent items from dominating forever
                    const frequencyWeight = Math.log10((entity.accessCount || 0) + 1);
            
                    // Combined Score: Vector similarity is the base, boosted by cognitive salience
                    const finalScore = vectorScore * (1 + (0.7 * recencyWeight) + (0.3 * frequencyWeight));
            
                    return { ...entity, finalScore };
                });
            
                // Sort by final score descending
                rankedEntities.sort((a, b) => b.finalScore - a.finalScore);
                
                // Return top 3 most salient entities
                return rankedEntities.slice(0, 3);
            }) as EntityDefinition[];
            
            // Fire-and-forget salience update for the entities that were actually chosen
            this.updateEntitySalience(proactiveEntities.map(e => e.id));


            // Step 4: Retrieve Semantic Memory (Relevant Knowledge)
            const semanticResults = await this.logStep(runId, 4, 'Retrieve Semantic Memory', { userQuery, topK: config.semanticMemoryTopK }, () =>
                conversation.useSemanticMemory
                    ? this.semanticMemory.query({ queryText: userQuery, topK: config.semanticMemoryTopK })
                    : Promise.resolve([])
            ) as ISemanticQueryResult[];

            // Step 5: Format Structured Memory (Mentioned Contacts & Proactive Entities)
            const structuredContext = await this.logStep(runId, 5, 'Format Structured Memory', { mentionedContacts, proactiveEntities }, () => {
                 let context = "";
                 if (conversation.useStructuredMemory) {
                    if (mentionedContacts.length > 0) {
                        context += "--- Mentioned Contacts ---\n";
                        context += mentionedContacts.map(c => `Contact: ${c.name} - ${c.notes || c.email || 'No details'}`).join('\n');
                        context += "\n";
                    }
                    if (proactiveEntities.length > 0) {
                        context += "--- Relevant Entities from Memory (Ranked by Salience) ---\n";
                        context += proactiveEntities.map(e => `Entity: ${e.name} (${e.type}) - ${e.description}`).join('\n');
                        context += "\n";
                    }
                 }
                return Promise.resolve(context);
            }) as string;

            // Step 6: Assemble the final prompt components
            const { systemInstruction, history } = await this.logStep(runId, 6, 'Assemble Context', { semanticResults, structuredContext, recentMessages }, () => {
                let contextBlock = "";
                if (semanticResults.length > 0) {
                    contextBlock += "--- Relevant Knowledge (Semantic Memory) ---\n";
                    contextBlock += semanticResults.map(r => `> ${r.text}`).join('\n');
                    contextBlock += "\n--------------------------\n";
                }
                if (structuredContext) {
                    contextBlock += structuredContext; // Already has headers
                    contextBlock += "--------------------------\n";
                }

                const finalSystemInstruction = `${disambiguationInstruction ? disambiguationInstruction + '\n\n' : ''}${conversation.systemPrompt || 'You are a helpful AI assistant.'}\n\n${contextBlock}`;
                
                const formattedHistory = recentMessages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.content }]
                }));
                formattedHistory.push({ role: 'user', parts: [{ text: userQuery }] });

                return Promise.resolve({ systemInstruction: finalSystemInstruction, history: formattedHistory });
            });
            
            const modelConfig = {
                temperature: conversation.temperature || 0.7,
                topP: conversation.topP || 0.95,
            };

            // Step 7: Call the LLM
            const llmStartTime = Date.now();
            const llmResponse = await this.logStep(
                runId,
                7,
                'Generate LLM Response',
                { historyLength: history.length },
                () => llmProvider.generateContent(history, systemInstruction, modelConfig, conversation.model || undefined),
                conversation.model || 'default',
                "History provided in payload",
                modelConfig
            );
            const llmResponseTime = Date.now() - llmStartTime;

            const totalDuration = Date.now() - startTime;
            
            await sql`
                UPDATE pipeline_runs 
                SET 
                    status = 'completed', 
                    "durationMs" = ${totalDuration}, 
                    "finalOutput" = ${llmResponse},
                    "finalLlmPrompt" = ${history[history.length - 1].parts[0].text},
                    "finalSystemInstruction" = ${systemInstruction},
                    "modelConfigJson" = ${JSON.stringify(modelConfig)}
                WHERE id = ${runId};
            `;
            
            return { llmResponse, llmResponseTime };

        } catch (error) {
            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'failed', "durationMs" = ${totalDuration}, "finalOutput" = ${(error as Error).message} WHERE id = ${runId};
            `;
            console.error("ContextAssemblyPipeline failed:", error);
            throw error;
        }
    }
}
