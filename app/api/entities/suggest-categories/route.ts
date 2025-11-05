import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";
import type { EntityDefinition } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found for categorization.");
    }
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { rows: entities } = await sql<EntityDefinition>`
            SELECT id, name, type, description FROM entity_definitions ORDER BY type, name;
        `;

        if (entities.length < 5) {
            return NextResponse.json({ categories: [] });
        }

        const formattedEntities = entities.map(e => `- ${e.name} (Type: ${e.type}, Desc: ${e.description || 'N/A'})`).join('\n');

        const prompt = `You are a data analyst and taxonomist. Your task is to analyze the following list of entities and group them into logical categories.

        **Entity List:**
        ${formattedEntities}

        **Instructions:**
        1. Identify groups of 3 or more entities that are semantically similar or belong to a common category.
        2. For each group, invent a concise and accurate category name (e.g., "JavaScript Framework", "Cloud Provider", "Project Manager").
        3. Ignore entities that are too generic or do not fit into a clear group.
        4. Return the results as a structured JSON object.

        Provide only the JSON object as your response.
        `;
        
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        categories: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { 
                                        type: Type.STRING,
                                        description: "The suggested category name."
                                    },
                                    entities: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.STRING,
                                            description: "The name of an entity belonging to this category."
                                        }
                                    }
                                },
                                required: ['name', 'entities']
                            }
                        }
                    },
                     required: ['categories'],
                }
            }
        });

        if (!response.text) {
            throw new Error("AI failed to generate category suggestions.");
        }

        const result = JSON.parse(response.text.trim());
        const entityMap = new Map(entities.map(e => [e.name, e.id]));

        // Augment the response with entity IDs for frontend convenience
        const categoriesWithIds = result.categories.map((category: any) => ({
            ...category,
            entities: category.entities
                .map((name: string) => ({ name, id: entityMap.get(name) }))
                .filter((e: any) => e.id) // Filter out any entities that might not have been found
        }));

        return NextResponse.json({ categories: categoriesWithIds });

    } catch (error) {
        console.error('Error suggesting categories:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}