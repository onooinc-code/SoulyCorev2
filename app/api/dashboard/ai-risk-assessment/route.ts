import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { Subsystem } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found.");
    }
    return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
    try {
        const { subsystem } = await req.json() as { subsystem: Subsystem };
        if (!subsystem) {
            return NextResponse.json({ error: 'Subsystem data is required.' }, { status: 400 });
        }

        const prompt = `
            You are an expert risk analyst for software projects. Analyze the following subsystem data and identify potential risks.
            Format your response as a bulleted list of the top 3-5 risks. Be concise and actionable.
            
            Subsystem Name: ${subsystem.name}
            Description: ${subsystem.description}
            Progress: ${subsystem.progress}%
            Health Score: ${subsystem.healthScore}
            Dependencies: ${subsystem.dependencies.join(', ') || 'None'}
            GitHub Stats: ${subsystem.githubStats.commits} commits, ${subsystem.githubStats.pullRequests} PRs, ${subsystem.githubStats.issues} open issues.
            Pending Milestones: ${subsystem.milestones.filter(m => !m.completed).map(m => m.description).join(', ') || 'None'}
            
            Based on this data, what are the primary risks to this subsystem's success?
        `;
        
        const ai = getAiClient();
        // @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
        const modelName = 'gemini-2.5-flash';

        const result = await ai.models.generateContent({ model: modelName, contents: prompt });
        
        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        if (!result.text) {
             throw new Error("AI failed to generate a risk assessment.");
        }
        
        return NextResponse.json({ result: result.text });

    } catch (error) {
        console.error('AI risk assessment failed:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
