import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI } from "@google/genai";
import type { EntityDefinition } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for enrichment.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;

        const { rows } = await sql<EntityDefinition>`SELECT name, description FROM entity_definitions WHERE id = ${entityId}`;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }
        const entity = rows[0];

        const prompt = `You are a research assistant. Your goal is to enrich a knowledge base entity's description using up-to-date information from the web.

        Entity Name: "${entity.name}"
        Current Description: "${entity.description || 'None'}"

        Using Google Search, find additional relevant information about this entity. Synthesize this new information with the current description to create a more comprehensive, single-paragraph description.
        
        Respond with ONLY the new, enriched paragraph.
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           config: {
             tools: [{googleSearch: {}}],
           },
        });

        if (!response.text) {
            throw new Error("AI failed to generate an enriched description.");
        }

        return NextResponse.json({ enrichedDescription: response.text.trim() });

    } catch (error) {
        console.error('Failed to enrich entity:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
