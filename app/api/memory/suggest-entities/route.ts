import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";
import type { Message, EntityDefinition } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found for memory extraction.");
    }
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { rows: messages } = await sql<Message>`
            SELECT role, content FROM messages ORDER BY "createdAt" DESC LIMIT 100;
        `;

        const { rows: entities } = await sql<EntityDefinition>`
            SELECT name, type FROM entity_definitions;
        `;

        if (messages.length < 10) {
            return NextResponse.json({ suggestions: [] });
        }

        const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n---\n');
        const existingEntityNames = entities.map(e => e.name);

        const ai = getAiClient();
        
        const prompt = `You are an intelligent assistant that analyzes conversation transcripts to find important named entities that haven't been saved yet.
        
        **Existing Entities:**
        ${existingEntityNames.join(', ')}

        **Conversation Transcript:**
        ---
        ${conversationText}
        ---

        **Your Task:**
        Identify up to 5 new, important entities (people, projects, companies, technologies, concepts) from the transcript that are NOT in the "Existing Entities" list.
        For each new entity you find, provide a name, a suitable type, and a brief description based on the context from the conversation.
        
        Respond with a JSON object containing a single key "suggestions".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ['name', 'type', 'description']
                            }
                        }
                    },
                     required: ['suggestions'],
                }
            }
        });

        if (!response.text) {
            return NextResponse.json({ suggestions: [] });
        }
        
        const extractedData = JSON.parse(response.text.trim());

        // Final filter to ensure no duplicates are suggested
        const lowercasedExisting = new Set(existingEntityNames.map(n => n.toLowerCase()));
        const filteredSuggestions = extractedData.suggestions.filter((s: any) => !lowercasedExisting.has(s.name.toLowerCase()));

        return NextResponse.json({ suggestions: filteredSuggestions });

    } catch (error) {
        console.error('Error in entity suggestion API:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
