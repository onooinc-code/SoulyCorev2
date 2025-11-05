import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI } from "@google/genai";
import type { EntityDefinition, Message } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for status summary.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;

        // 1. Fetch entity
        const { rows: entityRows } = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE id = ${entityId}`;
        if (entityRows.length === 0) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        const entity = entityRows[0];

        // 2. Fetch relationships
        const { rows: relRows } = await sql`
            SELECT p.name as "predicateName", t.name as "targetName" FROM entity_relationships er
            JOIN predicate_definitions p ON er."predicateId" = p.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            WHERE er."sourceEntityId" = ${entityId} LIMIT 10;
        `;
        const relationsStr = relRows.map(r => `- ${entity.name} -> ${r.predicateName} -> ${r.targetName}`).join('\n');

        // 3. Construct prompt
        const prompt = `Generate a very concise, one-sentence status summary for the entity "${entity.name}".
        Base the summary on its description and its most prominent relationships. Speak in a neutral, informative tone.

        Description: ${entity.description}
        Relationships:
        ${relationsStr || 'None'}

        Example: "ReactJS is a JavaScript library, primarily related to web development and created by Facebook."

        Summary:
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           config: {
             temperature: 0.3,
           },
        });

        if (!response.text) {
            return NextResponse.json({ summary: "Could not generate summary." });
        }

        return NextResponse.json({ summary: response.text.trim() });

    } catch (error) {
        console.error('Failed to generate status summary:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
