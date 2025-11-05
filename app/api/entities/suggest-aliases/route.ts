import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for alias suggestion.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Entity name is required.' }, { status: 400 });
        }

        const prompt = `Based on the entity name "${name}" and its description "${description || ''}", generate a list of 3-5 potential aliases, nicknames, or abbreviations.
        
        For example, for "ReactJS", you might suggest ["React.js", "React", "JS Library"]. For "John F. Kennedy", you might suggest ["JFK", "Jack Kennedy"].
        
        Return the list as a JSON array of strings.
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
                    aliases: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['aliases']
            }
           },
        });

        if (!response.text) {
            throw new Error("AI failed to generate aliases.");
        }

        const result = JSON.parse(response.text.trim());
        return NextResponse.json(result.aliases || []);

    } catch (error) {
        console.error('Failed to suggest aliases:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
