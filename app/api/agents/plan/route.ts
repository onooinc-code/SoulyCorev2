// app/api/agents/plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found for planning agent.");
    }
    // @google/genai-api-guideline-fix: Initialize GoogleGenAI with a named apiKey parameter.
    return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
    try {
        const { goal } = await req.json();

        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
        }

        const prompt = `
            You are an AI orchestrator. Your task is to break down a high-level goal into a sequence of smaller, actionable phases.
            For the following goal, create a plan consisting of 3 to 7 phases.
            Each phase should have a "goal" that is a clear, concise instruction for a subordinate AI agent.

            **Main Goal:** "${goal}"

            Respond with a JSON object containing a single key "plan", which is an array of objects. Each object in the array should have a "goal" property.
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
            // @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for this task.
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    goal: { type: Type.STRING }
                                },
                                required: ['goal']
                            }
                        }
                    },
                    required: ['plan']
                }
            }
        });

        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        const planData = JSON.parse(response.text.trim());
        
        return NextResponse.json(planData);

    } catch (error) {
        console.error('Error generating agent plan:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
