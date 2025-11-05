import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";
import type { EntityDefinition } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for relationship suggestion.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;

        // 1. Get source entity
        const { rows: sourceEntityRows } = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE id = ${entityId}`;
        if (sourceEntityRows.length === 0) return NextResponse.json({ error: 'Source entity not found' }, { status: 404 });
        const sourceEntity = sourceEntityRows[0];

        // 2. Get existing relationships for context
        const { rows: existingRels } = await sql`
            SELECT s.name as "sourceName", p.name as "predicateName", t.name as "targetName"
            FROM entity_relationships er
            JOIN entity_definitions s ON er."sourceEntityId" = s.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            JOIN predicate_definitions p ON er."predicateId" = p.id
            WHERE er."sourceEntityId" = ${entityId} OR er."targetEntityId" = ${entityId};
        `;
        const existingRelsStr = existingRels.map(r => `${r.sourceName} -> ${r.predicateName} -> ${r.targetName}`).join('\n');

        // 3. Get candidate target entities (e.g., recently accessed, or in the same brain)
        const { rows: candidateEntities } = await sql<EntityDefinition>`
            SELECT name, type, description FROM entity_definitions 
            WHERE id != ${entityId} AND "brainId" = ${sourceEntity.brainId}
            ORDER BY "lastAccessedAt" DESC LIMIT 20;
        `;
        const candidatesStr = candidateEntities.map(e => `- ${e.name} (Type: ${e.type}, Desc: ${e.description})`).join('\n');

        // 4. Call AI
        const prompt = `You are a knowledge graph expert. Your task is to suggest new, logical relationships for a given entity based on its context and a list of other potential entities.

        **Source Entity:**
        - Name: ${sourceEntity.name}
        - Type: ${sourceEntity.type}
        - Description: ${sourceEntity.description}

        **Existing Relationships for ${sourceEntity.name}:**
        ${existingRelsStr || 'None'}

        **Candidate Entities for New Relationships:**
        ${candidatesStr}

        **Instructions:**
        Analyze the source entity and the candidate entities. Suggest up to 3 new, logical relationships that are not in the "Existing Relationships" list.
        Format each suggestion as an object with "source", "predicate" (in snake_case), and "target". The source or target must be "${sourceEntity.name}".
        
        Return a JSON object with a single key "suggestions".
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
           model: "gemini-2.5-pro",
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           config: {
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
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
                required: ['suggestions']
            }
           },
        });

        if (!response.text) {
             return NextResponse.json({ suggestions: [] });
        }

        const result = JSON.parse(response.text.trim());
        return NextResponse.json({ suggestions: result.suggestions || [] });

    } catch (error) {
        console.error('Failed to suggest relationships:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
