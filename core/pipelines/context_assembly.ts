/**
 * @fileoverview Implements the Context Assembly Pipeline (Read Path).
 * This service orchestrates queries across all relevant memory modules to build a
 * compact, optimized context block for the LLM on each conversational turn.
 */

import { sql } from '@/lib/db';
import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import type { Contact } from '@/lib/types';

interface IAssembleContextParams {
    conversationId: string;
    userQuery: string;
    mentionedContacts?: Contact[];
    runId: string; // For logging
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
    
    private async logStep<T>(
        runId: string,
        stepOrder: number,
        stepName: string,
        fn: () => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            await sql`
                INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, output_payload, duration_ms, end_time)
                VALUES (${runId}, ${stepOrder}, ${stepName}, 'completed', ${JSON.stringify(result)}, ${duration}, CURRENT_TIMESTAMP);
            `;
            return result;
        } catch (e) {
            const duration = Date.now() - startTime;
            const errorMessage = (e as Error).message;
            await sql`
                INSERT INTO pipeline_run_steps (run_id, step_order, step_name, status, error_message, duration_ms, end_time)
                VALUES (${runId}, ${stepOrder}, ${stepName}, 'failed', ${errorMessage}, ${duration}, CURRENT_TIMESTAMP);
            `;
            throw e; // Re-throw the error to let the main pipeline handler know
        }
    }

    /**
     * Assembles a contextual string for the LLM by querying various memory sources.
     * @param params - An object containing the conversationId, userQuery, and any mentioned contacts.
     * @returns A promise that resolves to a single, formatted string of context.
     */
    async assembleContext(params: IAssembleContextParams): Promise<string> {
        const { userQuery, mentionedContacts, runId } = params;
        const contextParts: string[] = [];

        // Step 1: Fetch Structured Memory (Entities)
        const allEntities = await this.logStep(runId, 1, 'QueryStructuredMemory (Entities)', async () => {
             return await this.structuredMemory.query({ type: 'entity' }) as any[];
        });
        if (allEntities.length > 0) {
            const entityContext = "CONTEXT: You know about these entities:\n" +
                allEntities.map(e => `- ${e.name} (${e.type}): ${e.details_json}`).join('\n');
            contextParts.push(entityContext);
        }

        // Step 2: Fetch Semantic Memory (Knowledge Base)
        const semanticResults = await this.logStep(runId, 2, 'QuerySemanticMemory (Knowledge)', async () => {
             return await this.semanticMemory.query({ queryText: userQuery, topK: 3 });
        });
        if (semanticResults.length > 0) {
            const relevantKnowledge = semanticResults
                .filter(match => match.score > 0.5) // Add a relevance threshold
                .map((match: ISemanticQueryResult) => match.text)
                .join('\n\n');
            if (relevantKnowledge) {
                const semanticContext = `CONTEXT: Here is some relevant information from your knowledge base:\n${relevantKnowledge}`;
                contextParts.push(semanticContext);
            }
        }

        // Step 3: Fetch Contact Context
        if (mentionedContacts && mentionedContacts.length > 0) {
            // This data comes from the client, so we just log its inclusion
            await this.logStep(runId, 3, 'FormatMentionedContacts', async () => {
                const contactContext = "CONTEXT: You have the following context about people mentioned in this message:\n" +
                    mentionedContacts.map(c =>
                        `- Name: ${c.name}\n  Email: ${c.email || 'N/A'}\n  Company: ${c.company || 'N/A'}\n  Notes: ${c.notes || 'N/A'}`
                    ).join('\n\n');
                contextParts.push(contactContext);
                return mentionedContacts;
            });
        }

        return contextParts.join('\n\n---\n\n');
    }
}