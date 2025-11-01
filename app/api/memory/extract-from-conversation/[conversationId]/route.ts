import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Message } from '@/lib/types';
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found for memory extraction.");
    }
    return new GoogleGenAI({ apiKey });
};

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;

        const { rows: messages } = await sql<Message>`
            SELECT content FROM messages 
            WHERE "conversationId" = ${conversationId}
            ORDER BY "createdAt" ASC;
        `;

        if (messages.length === 0) {
            return NextResponse.json({ error: 'Conversation is empty or not found.' }, { status: 404 });
        }

        const conversationText = messages.map(m => m.content).join('\\n---\\n');
        
        const ai = getAiClient();
        
        const prompt = `Analyze the following text from a conversation. Your task is to extract key information and structure it as a JSON object.

        Text to analyze:
        ---
        ${conversationText}
        ---

        Respond with a JSON object containing three keys: "entities", "knowledge", and "relationships".
        - "entities": An array of objects. Each object should represent a distinct person, place, project, company, or important concept. Include a "name", a "type", and a concise "description" summarizing all relevant details from the text.
        - "knowledge": An array of strings. Each string must be a self-contained, factual statement or piece of information worth remembering.
        - "relationships": An array of objects representing the connections between the entities found in the text. Each object must have "source" (the name of the source entity), "predicate" (the verb or connecting phrase, e.g., 'works_for', 'is_located_in'), and "target" (the name of the target entity). Only include relationships where both source and target are present in your extracted entities list.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        entities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ['name', 'type', 'description']
                            }
                        },
                        knowledge: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        relationships: {
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
                     required: ['entities', 'knowledge', 'relationships'],
                }
            }
        });

        if (!response.text) {
            throw new Error("AI failed to extract information.");
        }
        
        const extractedData = JSON.parse(response.text.trim());

        return NextResponse.json(extractedData);

    } catch (error) {
        console.error('Error in memory extraction API:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
