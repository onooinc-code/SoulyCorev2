
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
        const response = await ai.models.list();
        
        // Filter and format the models
        // We only want models that support 'generateContent' and are likely 'gemini' models.
        const models = response.models
            ?.filter(m => 
                m.name.toLowerCase().includes('gemini') && 
                m.supportedGenerationMethods?.includes('generateContent')
            )
            .map(m => {
                // The API returns names like "models/gemini-1.5-flash"
                // We typically just want the ID part "gemini-1.5-flash"
                return m.name.replace('models/', '');
            })
            .sort((a, b) => b.localeCompare(a)); // Sort desc (newer usually higher numbers)

        // Ensure we have at least some models, otherwise fallback
        if (!models || models.length === 0) {
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
