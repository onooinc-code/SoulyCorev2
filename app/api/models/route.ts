
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            // Fallback if no key is present (though unlikely in prod)
            return NextResponse.json([
                'gemini-2.5-flash',
                'gemini-2.5-pro',
                'gemini-flash-latest'
            ]);
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Fetch models from the API
        // ai.models.list() returns a Pager<Model> which is an async iterable.
        const pager = await ai.models.list();
        
        const models: string[] = [];

        for await (const m of pager) {
            if (
                m.name && // Check if name exists
                m.name.toLowerCase().includes('gemini') && 
                m.supportedGenerationMethods?.includes('generateContent')
            ) {
                // The API returns names like "models/gemini-1.5-flash"
                // We typically just want the ID part "gemini-1.5-flash"
                models.push(m.name.replace('models/', ''));
            }
        }
        
        models.sort((a, b) => b.localeCompare(a)); // Sort desc (newer usually higher numbers)

        // Ensure we have at least some models, otherwise fallback
        if (models.length === 0) {
             return NextResponse.json([
                'gemini-2.5-flash',
                'gemini-2.5-pro',
                'gemini-flash-latest'
            ]);
        }

        return NextResponse.json(models);

    } catch (error) {
        console.error('Failed to fetch models from Google API:', error);
        // Fallback to static list on error to keep app usable
        return NextResponse.json([
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-flash-latest',
            'gemini-2.5-flash-image',
        ]);
    }
}
