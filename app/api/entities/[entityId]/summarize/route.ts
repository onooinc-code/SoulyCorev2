import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import type { EntityDefinition, Message } from '@/lib/types';
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found for entity summarization.");
    }
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { entityId: string } }) {
    const { entityId } = params;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch current entity state
        const { rows: entityRows } = await client.query<EntityDefinition>(`SELECT * FROM entity_definitions WHERE id = $1`, [entityId]);
        if (entityRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }
        const entity = entityRows[0];

        // 2. Fetch all relationships
        const { rows: relRows } = await client.query(`
            SELECT 
                'source' as direction, p.name as predicate, t.name as target_name
            FROM entity_relationships er
            JOIN predicate_definitions p ON er."predicateId" = p.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            WHERE er."sourceEntityId" = $1
            UNION ALL
            SELECT 
                'target' as direction, p.name as predicate, s.name as source_name
            FROM entity_relationships er
            JOIN predicate_definitions p ON er."predicateId" = p.id
            JOIN entity_definitions s ON er."sourceEntityId" = s.id
            WHERE er."targetEntityId" = $1;
        `, [entityId]);

        let formattedRelationships = "No known relationships.";
        if (relRows.length > 0) {
            formattedRelationships = relRows.map(r => 
                r.direction === 'source' 
                ? `- ${entity.name} -> ${r.predicate} -> ${r.target_name}`
                : `- ${r.source_name} -> ${r.predicate} -> ${entity.name}`
            ).join('\n');
        }

        // 3. Fetch recent message mentions
        const { rows: messageRows } = await client.query<Message>(`
            SELECT m.role, m.content
            FROM messages m
            JOIN message_entities me ON m.id = me."messageId"
            WHERE me."entityId" = $1
            ORDER BY m."createdAt" DESC
            LIMIT 20;
        `, [entityId]);

        let formattedMessages = "No recent mentions.";
        if (messageRows.length > 0) {
            formattedMessages = messageRows.map(m => `${m.role}: ${m.content}`).join('\n---\n');
        }

        // 4. Construct prompt and call AI
        const prompt = `You are an AI assistant tasked with creating a concise, up-to-date summary for a knowledge base entity.
Analyze all the provided information about the entity "${entity.name}" and synthesize it into a single, well-written descriptive paragraph.
Focus on the most important facts and relationships. Ignore trivial mentions. The description should be neutral and encyclopedic in tone.

**Current Entity Details:**
- Name: ${entity.name}
- Type: ${entity.type}
- Current Description: ${entity.description || 'N/A'}

**Known Relationships:**
${formattedRelationships}

**Recent Mentions in Conversations:**
${formattedMessages}

---
**New Synthesized Description (respond with only the paragraph text):**
`;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0.5,
            }
        });
        
        const newDescription = response.text?.trim();

        if (!newDescription) {
            throw new Error('AI failed to generate a new description.');
        }

        // 5. Update entity and log history
        await client.query(
            `UPDATE entity_definitions SET description = $1, "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
            [newDescription, entityId]
        );
        
        await client.query(
            `INSERT INTO entity_history ("entityId", "fieldName", "oldValue", "newValue", "version", "changedBy")
             VALUES ($1, 'description', $2, $3, $4, 'ai_summarizer')`,
             [entityId, entity.description, newDescription, entity.version]
        );

        await client.query('COMMIT');
        
        return NextResponse.json({ success: true, newDescription });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to summarize entity ${entityId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    } finally {
        client.release();
    }
}
