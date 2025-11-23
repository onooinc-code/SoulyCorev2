import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { sql, db } from '@/lib/db';
import type { PipelineRun, EntityDefinition, EntityRelationship, PredicateDefinition } from '@/lib/types';
import { IMemoryExtractionConfig } from '../memory/types';
import { GoogleGenAI, Type } from "@google/genai";

interface IMemoryExtractionParams {
    text: string;
    messageId: string;
    conversationId: string;
    brainId: string | null;
    config: IMemoryExtractionConfig;
}

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;
    private entityVectorMemory: EntityVectorMemoryModule;
    private ai: GoogleGenAI;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not found for MemoryExtractionPipeline.");
        }
        this.ai = new GoogleGenAI({ apiKey });
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

    private async _runLLMBasedInference(
        newRelationships: EntityRelationship[],
        allEntities: EntityDefinition[],
        brainId: string | null,
        provenance: any
    ) {
        if (newRelationships.length === 0) return { inferencesMade: 0 };

        const entityIds = new Set<string>();
        newRelationships.forEach(rel => {
            entityIds.add(rel.sourceEntityId);
            entityIds.add(rel.targetEntityId);
        });

        // Fetch all relationships involving these entities
        const { rows: existingRels } = await db.query(`
            SELECT r.*, p.name as "predicateName", s.name as "sourceName", t.name as "targetName"
            FROM entity_relationships r
            JOIN predicate_definitions p ON r."predicateId" = p.id
            JOIN entity_definitions s ON r."sourceEntityId" = s.id
            JOIN entity_definitions t ON r."targetEntityId" = t.id
            WHERE (r."sourceEntityId" = ANY($1::uuid[]) OR r."targetEntityId" = ANY($1::uuid[]))
            AND (r."brainId" = $2 OR r."brainId" IS NULL)
        `, [Array.from(entityIds), brainId]);

        if (existingRels.length <= 1) {
            return { inferencesMade: 0 }; // Not enough facts to infer anything
        }

        const facts = existingRels.map(r => `'${r.sourceName}' -> '${r.predicateName}' -> '${r.targetName}'`).join('\n');

        const prompt = `
            You are a logical inference engine. Based on the following known facts, deduce new relationships.
            Do not repeat existing facts. Only state new, valid, and logical inferences.
            For example, if you know "A works_for B" and "B is_located_in C", you can infer "A has_work_location C".

            Known Facts:
            ${facts}

            Inferred Relationships:
        `;

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-pro', // Use a more powerful model for reasoning
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        inferences: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    source: { type: Type.STRING },
                                    predicate: { type: Type.STRING },
                                    target: { type: Type.STRING }
                                },
                                required: ['source', 'predicate', 'target']
                            }
                        }
                    },
                     required: ['inferences'],
                }
            }
        });

        if (!response.text) return { inferencesMade: 0 };

        const { inferences } = JSON.parse(response.text.trim());
        if (!inferences || inferences.length === 0) return { inferencesMade: 0 };

        const entityMap = new Map(allEntities.map(e => [e.name.toLowerCase(), e.id]));
        const predicateMap = new Map<string, string>();

        let inferencesMade = 0;
        for (const inference of inferences) {
            const sourceId = entityMap.get(inference.source.toLowerCase());
            const targetId = entityMap.get(inference.target.toLowerCase());

            if (!sourceId || !targetId) continue;

            let predicateId = predicateMap.get(inference.predicate);
            if (!predicateId) {
                const { rows: predRows } = await sql`
                    INSERT INTO predicate_definitions (name) VALUES (${inference.predicate})
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id;
                `;
                const newId = predRows[0]?.id;
                if (!newId) {
                    console.warn(`Could not create predicate for '${inference.predicate}'`);
                    continue;
                }
                predicateId = newId;
                predicateMap.set(inference.predicate, newId);
            }

            const { rows: checkRows } = await sql`
                SELECT id FROM entity_relationships WHERE "sourceEntityId" = ${sourceId} AND "targetEntityId" = ${targetId} AND "predicateId" = ${predicateId}
            `;

            if (checkRows.length === 0) {
                const inferredProvenance = { ...provenance, type: 'inferred_llm', from: facts.split('\n') };
                await this.structuredMemory.store({
                    type: 'relationship',
                    data: {
                        sourceEntityId: sourceId,
                        targetEntityId: targetId,
                        predicateId: predicateId,
                        provenance: inferredProvenance,
                        brainId: brainId
                    }
                });
                inferencesMade++;
            }
        }
        return { inferencesMade };
    }

    private async _runRuleBasedInference(
        newlyCreatedRels: EntityRelationship[],
        brainId: string | null,
        provenance: any
    ) {
        const { rows: rulePredicates } = await sql<PredicateDefinition>`
            SELECT id, name, "isSymmetric", "isTransitive" 
            FROM predicate_definitions 
            WHERE "isSymmetric" = true OR "isTransitive" = true
        `;
    
        if (rulePredicates.length === 0) return { inferredCount: 0 };
    
        const symmetricPredicateIds = new Set(rulePredicates.filter(p => p.isSymmetric).map(p => p.id));
        const transitivePredicateIds = new Set(rulePredicates.filter(p => p.isTransitive).map(p => p.id));
        let inferredCount = 0;
    
        const newInferences: Omit<EntityRelationship, 'id' | 'createdAt'>[] = [];
    
        // 1. Symmetric Inference
        for (const rel of newlyCreatedRels) {
            if (symmetricPredicateIds.has(rel.predicateId)) {
                newInferences.push({
                    sourceEntityId: rel.targetEntityId,
                    targetEntityId: rel.sourceEntityId,
                    predicateId: rel.predicateId,
                    provenance: { ...provenance, type: 'inferred_symmetric', from: rel.id },
                    brainId: brainId,
                });
            }
        }
    
        // 2. Transitive Inference (one level deep for simplicity)
        for (const rel of newlyCreatedRels) {
            if (transitivePredicateIds.has(rel.predicateId)) {
                // Find A -> B (new), look for B -> C (existing) => infer A -> C
                const { rows: secondLegRels } = await sql<EntityRelationship>`
                    SELECT * FROM entity_relationships 
                    WHERE "sourceEntityId" = ${rel.targetEntityId} AND "predicateId" = ${rel.predicateId}
                `;
                for (const secondLeg of secondLegRels) {
                    newInferences.push({
                        sourceEntityId: rel.sourceEntityId,
                        targetEntityId: secondLeg.targetEntityId,
                        predicateId: rel.predicateId,
                        provenance: { ...provenance, type: 'inferred_transitive', from: [rel.id, secondLeg.id] },
                        brainId: brainId,
                    });
                }
    
                // Find B -> C (new), look for A -> B (existing) => infer A -> C
                const { rows: firstLegRels } = await sql<EntityRelationship>`
                    SELECT * FROM entity_relationships 
                    WHERE "targetEntityId" = ${rel.sourceEntityId} AND "predicateId" = ${rel.predicateId}
                `;
                for (const firstLeg of firstLegRels) {
                     newInferences.push({
                        sourceEntityId: firstLeg.sourceEntityId,
                        targetEntityId: rel.targetEntityId,
                        predicateId: rel.predicateId,
                        provenance: { ...provenance, type: 'inferred_transitive', from: [firstLeg.id, rel.id] },
                        brainId: brainId,
                    });
                }
            }
        }
        
        // 3. Batch insert new inferences, ignoring conflicts
        if (newInferences.length > 0) {
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                for (const inference of newInferences) {
                    const res = await client.query(`
                        INSERT INTO entity_relationships ("sourceEntityId", "targetEntityId", "predicateId", provenance, "brainId", "confidenceScore")
                        VALUES ($1, $2, $3, $4, $5, 0.95)
                        ON CONFLICT ("sourceEntityId", "targetEntityId", "predicateId") DO NOTHING;
                    `, [inference.sourceEntityId, inference.targetEntityId, inference.predicateId, JSON.stringify(inference.provenance), inference.brainId]);
                    // FIX: Handle potential null value for rowCount
                    if ((res.rowCount ?? 0) > 0) {
                        inferredCount++;
                    }
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }
    
        return { inferredCount };
    }


    async run(params: IMemoryExtractionParams) {
        const { text, messageId, conversationId, brainId, config } = params;
        
        const { rows: runRows } = await sql<PipelineRun>`
            INSERT INTO pipeline_runs ("messageId", "pipelineType", status)
            VALUES (${messageId}, 'MemoryExtraction', 'running') RETURNING id;
        `;
        const runId = runRows[0].id;
        const startTime = Date.now();

        try {
            const extractionResult = await this.logStep(runId, 1, 'Extract Entities, Knowledge, and Relationships', { text }, async () => {
                const prompt = `Analyze the following text from a conversation. Your task is to extract key information as a JSON object.

                Text to analyze:
                "${text}"

                Respond with a JSON object containing "entities", "knowledge", and "relationships".
                - "entities": An array of objects, each with "name", "type", and "description".
                - "knowledge": An array of self-contained, factual strings.
                - "relationships": An array of objects, each with "source", "predicate" (e.g., 'works_for'), and "target".
                `;
                
                const response = await this.ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                         responseMimeType: "application/json",
                         responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['name', 'type', 'description'] } },
                                knowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
                                relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, predicate: { type: Type.STRING }, target: { type: Type.STRING } }, required: ['source', 'predicate', 'target'] } }
                            },
                             required: ['entities', 'knowledge', 'relationships'],
                        }
                    }
                });
                if (!response.text) {
                    throw new Error("AI failed to extract information. The response was empty.");
                }
                return JSON.parse(response.text.trim());
            });

            const provenance = {
                type: 'memory_extraction',
                source: 'conversation',
                conversationId: params.conversationId,
                messageId: params.messageId,
            };

            let storedEntities: EntityDefinition[] = [];
            if (config.enableEntityExtraction && extractionResult.entities && extractionResult.entities.length > 0) {
                storedEntities = await this.logStep(runId, 2, 'Store Entities & Embeddings', { count: extractionResult.entities.length }, () => 
                    Promise.all(extractionResult.entities.map(async (entity: any) => {
                        const vectorId = await this.semanticMemory.store({ text: `${entity.name} (${entity.type}): ${entity.description}` });
                        return this.structuredMemory.store({
                            type: 'entity',
                            data: { ...entity, vectorId, provenance, brainId }
                        });
                    }))
                );
            }
            
            const allEntitiesInBrain = await this.structuredMemory.query({ type: 'entity' }) as EntityDefinition[];
            let storedDirectRelationships: EntityRelationship[] = [];

            if (extractionResult.relationships && extractionResult.relationships.length > 0) {
                storedDirectRelationships = await this.logStep(runId, 3, 'Store Direct Relationships', { count: extractionResult.relationships.length }, async () => {
                    const entityMap = new Map(allEntitiesInBrain.map(e => [e.name.toLowerCase(), e.id]));
                    const predicateMap = new Map<string, string>();
                    const createdRels: EntityRelationship[] = [];

                    for (const rel of extractionResult.relationships) {
                        let predicateId = predicateMap.get(rel.predicate);
                        if (!predicateId) {
                            const { rows: predRows } = await sql`INSERT INTO predicate_definitions (name) VALUES (${rel.predicate}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id;`;
                            const newId = predRows[0]?.id;
                            if (!newId) {
                                console.warn(`Could not find or create predicate ID for '${rel.predicate}'`);
                                continue;
                            }
                            predicateId = newId;
                            predicateMap.set(rel.predicate, newId);
                        }

                        const sourceId = entityMap.get(rel.source.toLowerCase());
                        const targetId = entityMap.get(rel.target.toLowerCase());

                        if (sourceId && targetId && predicateId) {
                            const newRel = await this.structuredMemory.store({
                                type: 'relationship',
                                data: { sourceEntityId: sourceId, targetEntityId: targetId, predicateId, provenance, brainId }
                            });
                            createdRels.push(newRel);
                        }
                    }
                    return createdRels;
                });

                await this.logStep(runId, 4, 'Infer Relationships (LLM)', { newDirectRels: storedDirectRelationships.length }, () =>
                    this._runLLMBasedInference(storedDirectRelationships, allEntitiesInBrain, brainId, provenance)
                );
                
                if (storedDirectRelationships.length > 0) {
                    await this.logStep(runId, 5, 'Infer Relationships (Rule-Based)', { count: storedDirectRelationships.length }, () => 
                        this._runRuleBasedInference(storedDirectRelationships, brainId, provenance)
                    );
                }
            }


            if (config.enableKnowledgeExtraction && extractionResult.knowledge) {
                 await this.logStep(runId, 6, 'Store Knowledge', { count: extractionResult.knowledge.length }, () =>
                    Promise.all(extractionResult.knowledge.map((k: string) =>
                        this.semanticMemory.store({ text: k })
                    ))
                );
            }
            
            if (config.enableSegmentExtraction) {
                await this.logStep(runId, 7, 'Extract Segments', { text }, async () => {
                    return { segments: ['Project Alpha', 'Q3 Planning'] }; // Mock result
                });
            }


            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'completed', "durationMs" = ${totalDuration}, "finalOutput" = ${'Extraction successful.'} WHERE id = ${runId};
            `;
            
        } catch (error) {
             const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'failed', "durationMs" = ${totalDuration}, "finalOutput" = ${(error as Error).message} WHERE id = ${runId};
            `;
            console.error("MemoryExtractionPipeline failed:", error);
            throw error;
        }
    }
}