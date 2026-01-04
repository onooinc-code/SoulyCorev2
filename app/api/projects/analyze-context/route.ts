
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = 'force-dynamic';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found.");
    return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
    try {
        const { content, type } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const prompt = `
            Analyze the following project context (${type}). 
            Provide a brief summary and list 3-5 key takeaways or facts that will be memorized.
            
            Content:
            """
            ${content.substring(0, 5000)}
            """
            
            Return JSON with "summary" (string) and "keyPoints" (array of strings).
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['summary', 'keyPoints']
                }
            }
        });

        if (!response.text) throw new Error("AI analysis failed.");
        
        return NextResponse.json(JSON.parse(response.text));

    } catch (error) {
        console.error('Context analysis failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
