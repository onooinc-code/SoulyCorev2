
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '@/lib/db';
import type { Experience } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found.");
    return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
    try {
        const { goal } = await req.json();
        if (!goal) return NextResponse.json({ error: 'Goal is required' }, { status: 400 });

        // 1. Find Similar Experiences to guide planning
        const queryWords = goal.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const { rows: experiences } = await db.query(`
            SELECT * FROM experiences 
            WHERE "triggerKeywords" && $1::text[]
            LIMIT 2
        `, [queryWords]);

        const experienceContext = experiences.length > 0 
            ? `Refer to these successful previous plans for similar goals:\n${experiences.map((e: Experience) => `- Goal Pattern: ${e.goalTemplate} -> Plan: ${JSON.stringify(e.stepsJson)}`).join('\n')}`
            : 'No previous experiences found for this goal type.';

        const prompt = `
            You are an AI orchestrator. 
            Goal: "${goal}"
            
            ${experienceContext}
            
            Break this goal into 3-7 actionable phases. 
            Return JSON: { "plan": [ { "goal": "step description" } ] }
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // High logic for planning
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plan: {
                            type: Type.ARRAY,
                            items: { type: Type.OBJECT, properties: { goal: { type: Type.STRING } } }
                        }
                    }
                }
            }
        });

        if (!response.text) throw new Error("Planning failed.");
        return NextResponse.json(JSON.parse(response.text.trim()));

    } catch (error) {
        console.error('Agent plan failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
