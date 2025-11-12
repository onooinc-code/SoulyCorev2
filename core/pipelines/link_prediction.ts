import { sql, db } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import ILinkPredictionProposal from the central types definition file.
import { EntityDefinition, ILinkPredictionProposal } from '@/lib/types';

interface ILinkPredictionParams {
    conversationId: string;
    brainId: string | null;
}

export class LinkPredictionPipeline {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not found for LinkPredictionPipeline.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    public async run(params: ILinkPredictionParams): Promise<ILinkPredictionProposal | null> {
        // 1. Find frequently co-mentioned entities in recent messages
        const { rows: coMentionedPairs } = await db.query(`
            WITH recent_messages AS (
                SELECT id FROM messages WHERE "conversationId" = $1 ORDER BY "createdAt" DESC LIMIT 10
            ),
            entity_pairs AS (
                SELECT
                    me1."entityId" as entity_id_1,
                    me2."entityId" as entity_id_2,
                    COUNT(me1."messageId") as mention_count
                FROM message_entities me1
                JOIN message_entities me2 ON me1."messageId" = me2."messageId" AND me1."entityId" < me2."entityId"
                WHERE me1."messageId" IN (SELECT id FROM recent_messages)
                GROUP BY 1, 2
                HAVING COUNT(me1."messageId") > 1 -- Must appear together more than once
            )
            SELECT
                ep.entity_id_1,
                ep.entity_id_2
            FROM entity_pairs ep
            LEFT JOIN entity_relationships er ON
                (er."sourceEntityId" = ep.entity_id_1 AND er."targetEntityId" = ep.entity_id_2) OR
                (er."sourceEntityId" = ep.entity_id_2 AND er."targetEntityId" = ep.entity_id_1)
            WHERE er.id IS NULL
            ORDER BY ep.mention_count DESC
            LIMIT 1;
        `, [params.conversationId]);

        if (coMentionedPairs.length === 0) {
            return null;
        }

        const { entity_id_1, entity_id_2 } = coMentionedPairs[0];

        // 2. Fetch entity details
        // FIX: Removed the generic type argument from `db.query` as the wrapper function in `lib/db.ts` does not support it. This resolves the TypeScript error "Expected 0 type arguments, but got 1."
        const { rows: entities } = await db.query(
            `SELECT id, name, description FROM entity_definitions WHERE id = ANY($1::uuid[])`,
            [[entity_id_1, entity_id_2]]
        );
        

        if (entities.length < 2) {
            return null;
        }
        const entity1 = entities.find(e => e.id === entity_id_1);
        const entity2 = entities.find(e => e.id === entity_id_2);

        if (!entity1 || !entity2) return null;

        // 3. Ask AI to suggest a predicate
        const prompt = `
            Based on the following two entities which are frequently mentioned together, suggest a likely relationship predicate between them.
            A predicate should be a short, descriptive verb phrase in snake_case (e.g., 'is_deployed_on', 'works_for').

            Entity 1: "${entity1.name}" (Description: ${entity1.description})
            Entity 2: "${entity2.name}" (Description: ${entity2.description})

            Suggest a predicate for the relationship: ${entity1.name} -> [PREDICATE] -> ${entity2.name}
        `;

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        predicate: {
                            type: Type.STRING,
                            description: "The suggested relationship predicate in snake_case."
                        }
                    },
                    required: ['predicate']
                }
            }
        });

        if (!response.text) {
            return null;
        }

        const { predicate } = JSON.parse(response.text.trim());

        if (!predicate) {
            return null;
        }

        return {
            sourceEntity: { id: entity1.id, name: entity1.name },
            targetEntity: { id: entity2.id, name: entity2.name },
            suggestedPredicate: predicate,
        };
    }
}