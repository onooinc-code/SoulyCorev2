import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for type suggestion.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Entity name is required.' }, { status: 400 });
        }

        const { rows } = await sql`SELECT DISTINCT type FROM entity_definitions`;
        const existingTypes = rows.map(r => r.type);

        if (existingTypes.length === 0) {
            return NextResponse.json({ suggestedType: 'Misc' });
        }

        const prompt = `Given the entity name "${name}" and its description "${description || ''}", which of the following existing types is the most appropriate?
        
        Existing Types: ${existingTypes.join(', ')}

        Respond with a JSON object containing a single key "suggestedType".
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: [{ role: 'user', parts: [{ text: prompt }] }],
           config: {
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestedType: { type: Type.STRING }
                },
                required: ['suggestedType']
            }
           },
        });

        if (!response.text) {
            throw new Error("AI failed to suggest a type.");
        }

        const result = JSON.parse(response.text.trim());
        
        // Ensure the suggested type is one of the existing ones
        const suggestedType = existingTypes.find(t => t.toLowerCase() === result.suggestedType.toLowerCase()) || 'Misc';

        return NextResponse.json({ suggestedType });

    } catch (error) {
        console.error('Failed to suggest type:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
