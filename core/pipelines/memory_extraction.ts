/**
 * @fileoverview Implementation of the Memory Extraction Pipeline (Write Path).
 * This pipeline runs post-conversation to analyze the exchange, extract knowledge,
 * and commit it to the appropriate long-term Single Memory Modules (SMMs).
 */

import { IMemoryExtractionConfig } from '../memory/types';
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '../llm';
import { sql } from '@/lib/db';
import { Type } from '@google/genai';
import type { EntityDefinition, Segment } from '@/lib/types';

interface MemoryExtractionInput {
    text: string; // The text to analyze (e.g., user query + AI response)
    messageId: string;
    conversationId: string;
    config: IMemoryExtractionConfig;
}

interface RawExtractedEntity {
    name: string;
    type: string;
    description: string;
    aliases: string[];
}

export class MemoryExtractionPipeline {

     private async logStep(runId: string, order: number, name: string, input: any, output: any, duration: number) {
        await sql`
            INSERT INTO pipeline_run_steps (run_id, step_order, step_name, input_payload, output_payload, duration_ms, status)
            VALUES (${runId}, ${order}, ${name}, ${JSON.stringify(input)}, ${JSON.stringify(output)}, ${duration}, 'completed');
        `;
    }
    
    public async run(input: MemoryExtractionInput): Promise<void> {
        const startTime = Date.now();
        const { rows: runRows } = await sql`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${input.messageId}, 'MemoryExtraction', 'running')
            RETURNING id;
        `;
        const runId = runRows[0].id;
        
        try {
            let stepOrder = 1;

            if (input.config.enableEntityExtraction) {
                // 1. Extract raw entities with descriptions
                const step1Time = Date.now();
                const rawEntities = await this._extractEntitiesWithDescriptions(input.text);
                await this.logStep(runId, stepOrder++, '1.ExtractRawEntities', { text: input.text }, { count: rawEntities.length }, Date.now() - step1Time);

                if (rawEntities.length > 0) {
                    // 2. Resolve entities (check for duplicates/aliases)
                    const step2Time = Date.now();
                    const resolvedEntities = await this._resolveEntities(rawEntities);
                    await this.logStep(runId, stepOrder++, '2.ResolveEntities', { rawCount: rawEntities.length }, { resolvedCount: resolvedEntities.length }, Date.now() - step2Time);

                    // 3. Extract and store relationships between resolved entities
                    if (resolvedEntities.length > 1) {
                        const step3Time = Date.now();
                        await this._extractAndStoreRelationships(input.text, resolvedEntities);
                        await this.logStep(runId, stepOrder++, '3.ExtractRelationships', { entityCount: resolvedEntities.length }, {}, Date.now() - step3Time);
                    }
                    
                    // 4. Link messages to entities
                    await sql`
                        INSERT INTO message_entities (message_id, entity_id)
                        SELECT ${input.messageId}, id FROM entity_definitions WHERE id = ANY(${resolvedEntities.map(e => e.id)})
                        ON CONFLICT DO NOTHING;
                    `;
                }
            }

            if (input.config.enableSegmentExtraction) {
                const stepTime = Date.now();
                const linkedSegments = await this._extractAndLinkSegments(input.text, input.messageId);
                await this.logStep(runId, stepOrder++, 'ExtractAndLinkSegments', { text: input.text }, { linkedSegments }, Date.now() - stepTime);
            }

            const totalDuration = Date.now() - startTime;
            await sql`
                UPDATE pipeline_runs SET status = 'completed', duration_ms = ${totalDuration} WHERE id = ${runId};
            `;
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            const errorMessage = (error as Error).message;
             await sql`
                UPDATE pipeline_runs SET status = 'failed', duration_ms = ${totalDuration}, final_output = ${errorMessage} WHERE id = ${runId};
            `;
            console.error("MemoryExtractionPipeline failed:", error);
        }
    }

    private async _extractEntitiesWithDescriptions(text: string): Promise<RawExtractedEntity[]> {
        const prompt = `
            Analyze the following text to identify key entities (people, projects, companies, concepts). 
            For each entity, provide its canonical name, a general type, a concise description based on the context, and any potential aliases mentioned.

            Text: "${text}"
        `;
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
            },
        };
        const response = await llmProvider.generateContent(
            [{ role: 'user', parts: [{ text: prompt }] }], "You are a data extraction expert.", 
            // @ts-ignore
            { responseMimeType: 'application/json', responseSchema }, 'gemini-2.5-pro');
        try {
            return JSON.parse(response);
        } catch (e) {
            console.error("Failed to parse entities from LLM:", response, e);
            return [];
        }
    }
    
    private async _resolveEntities(rawEntities: RawExtractedEntity[]): Promise<EntityDefinition[]> {
        const entityVectorMemory = new EntityVectorMemoryModule();
        const structuredMemory = new StructuredMemoryModule();
        const finalEntities: EntityDefinition[] = [];

        for (const rawEntity of rawEntities) {
            const searchText = `${rawEntity.name} - ${rawEntity.description}`;
            const similar = await entityVectorMemory.query({ queryText: searchText, topK: 1 });

            let finalEntity: EntityDefinition | null = null;

            if (similar.length > 0 && similar[0].score > 0.85) { // High confidence match
                const existingEntityId = similar[0].id;
                // Disambiguation step with LLM
                const { rows } = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE id = ${existingEntityId}`;
                const existingEntity = rows[0];

                const disambiguationPrompt = `Does the new entity '${rawEntity.name}' (${rawEntity.description}) refer to the same thing as the existing entity '${existingEntity.name}' (${existingEntity.description})? Answer with only "yes" or "no".`;
                const decision = await llmProvider.generateContent([{ role: 'user', parts: [{ text: disambiguationPrompt }] }], "You are a decision-making AI.");
                
                if (decision.toLowerCase().includes('yes')) {
                    // It's the same entity, update aliases
                    const newAliases = Array.from(new Set([...(existingEntity.aliases || []), rawEntity.name, ...(rawEntity.aliases || [])]));
                    finalEntity = await structuredMemory.store({ type: 'entity', data: { ...existingEntity, aliases: newAliases } }) as EntityDefinition;
                }
            }

            if (!finalEntity) {
                // It's a new entity, create it
                finalEntity = await structuredMemory.store({ type: 'entity', data: rawEntity }) as EntityDefinition;
            }
            
            if (finalEntity) {
                 // Store its vector representation in Upstash
                await entityVectorMemory.store({ id: finalEntity.id, text: `${finalEntity.name} - ${finalEntity.description}`, metadata: { entity_id: finalEntity.id } });
                finalEntities.push(finalEntity);
            }
        }
        return finalEntities;
    }

    private async _extractAndStoreRelationships(text: string, entities: EntityDefinition[]): Promise<void> {
        if (entities.length < 2) return;
        const structuredMemory = new StructuredMemoryModule();

        const entityList = entities.map(e => `'${e.name}' (ID: ${e.id})`).join(', ');
        const prompt = `Based on the text below, what are the relationships between these entities: [${entityList}]? Use predicates like 'works_on', 'manages', 'located_in', etc.

        Text: "${text}"
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    source_entity_id: { type: Type.STRING },
                    predicate: { type: Type.STRING },
                    target_entity_id: { type: Type.STRING },
                    context: { type: Type.STRING },
                },
            },
        };
        const response = await llmProvider.generateContent([{role: 'user', parts: [{text: prompt}]}], "You are a relationship extraction expert.", 
        // @ts-ignore
        { responseMimeType: 'application/json', responseSchema }, 'gemini-2.5-pro');

        try {
            const relationships = JSON.parse(response);
            for (const rel of relationships) {
                // Ensure the IDs exist in our resolved list before storing
                if (entities.find(e => e.id === rel.source_entity_id) && entities.find(e => e.id === rel.target_entity_id)) {
                    await structuredMemory.store({ type: 'relationship', data: rel });
                }
            }
        } catch (e) {
            console.error("Failed to parse or store relationships:", response, e);
        }
    }

    private async _extractAndLinkSegments(text: string, messageId: string): Promise<string[]> {
        const { rows: segments } = await sql<Segment>`SELECT id, name, description FROM segments`;
        if (segments.length === 0) {
            return [];
        }

        const segmentListForPrompt = segments.map(s => `- ${s.name}: ${s.description || 'No description'}`).join('\n');
        const prompt = `
            Analyze the following text and determine which of the predefined segments it belongs to.
            The text may belong to multiple segments.

            Text to analyze:
            ---
            "${text}"
            ---

            Available Segments:
            ---
            ${segmentListForPrompt}
            ---

            Based on the text, identify all relevant segment names.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                relevant_segments: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'The name of a relevant segment.'
                    }
                }
            }
        };

        const responseJsonStr = await llmProvider.generateContent(
            [{ role: 'user', parts: [{ text: prompt }] }],
            "You are a text classification expert. Respond only with the requested JSON object.",
            // @ts-ignore
            { responseMimeType: 'application/json', responseSchema },
            'gemini-2.5-pro'
        );

        try {
            const response = JSON.parse(responseJsonStr);
            const relevantSegmentNames: string[] = response.relevant_segments || [];

            if (relevantSegmentNames.length > 0) {
                const segmentMap = new Map(segments.map(s => [s.name, s.id]));
                const valuesToInsert = relevantSegmentNames
                    .map(name => segmentMap.get(name))
                    .filter(id => !!id)
                    .map(segmentId => `('${messageId}', '${segmentId}')`)
                    .join(',');

                if (valuesToInsert) {
                    await sql.query(`
                        INSERT INTO message_segments (message_id, segment_id)
                        VALUES ${valuesToInsert}
                        ON CONFLICT DO NOTHING;
                    `);
                }
            }
            return relevantSegmentNames;
        } catch (e) {
            console.error("Failed to parse or store segments from LLM response:", responseJsonStr, e);
            return [];
        }
    }
}