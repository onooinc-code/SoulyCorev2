
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("API key not found.");
  return new GoogleGenAI({ apiKey });
};
// @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
const modelName = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
    try {
        const { goal } = await req.json();
        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
        }

        const ai = getAiClient();

        const prompt = `You are a world-class AI Orchestrator Agent. Your sole responsibility is to take a high-level user goal and break it down into a logical, sequential plan of smaller, actionable steps.

        **User Goal:**
        "${goal}"

        **Instructions:**
        - Analyze the user's goal carefully.
        - Decompose it into a series of clear, concise steps. Each step should represent a single, logical task.
        - The output MUST be a valid JSON array of objects.
        - Each object in the array must have a single key: "goal". The value should be a string describing the goal for that specific step.
        - Do not add any commentary, explanations, or any text outside of the JSON array.

        **Example Output:**
        [
          { "goal": "Research and identify the top 5 competitors in the target market." },
          { "goal": "Analyze the pricing strategy for each competitor." },
          { "goal": "Summarize the key strengths and weaknesses of each competitor's product." },
          { "goal": "Compile the findings into a structured comparison table." }
        ]`;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    goal: {
                        type: Type.STRING,
                        description: 'The specific goal for this phase of the plan.',
                    },
                },
                required: ['goal'],
            },
        };

        const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        if (!result.text) {
            throw new Error("AI planner failed to generate a plan.");
        }
        
        const plan = JSON.parse(result.text.trim());
        
        return NextResponse.json({ plan });

    } catch (error) {
        console.error('Agent planning failed:', error);
        return NextResponse.json({ error: 'Failed to generate a plan', details: (error as Error).message }, { status: 500 });
    }
}
