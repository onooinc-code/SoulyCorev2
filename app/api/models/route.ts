
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Definitive list of models to ensure the UI always has options
    const allModels = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.5-flash-thinking', // Hypothetical/Preview
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-flash-latest',
        'gemini-2.5-flash-image'
    ];

    try {
        let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        
        if (apiKey) {
            apiKey = apiKey.trim();
             // Remove surrounding quotes if present
            if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                apiKey = apiKey.substring(1, apiKey.length - 1);
            }

            const ai = new GoogleGenAI({ apiKey });
            // Attempt to fetch fresh list, but don't block on it failing
            try {
                const pager = await ai.models.list();
                for await (const m of pager) {
                    const modelAny = m as any;
                    if (modelAny.name) {
                        const cleanName = modelAny.name.replace('models/', '');
                        if (!allModels.includes(cleanName) && cleanName.includes('gemini')) {
                            allModels.push(cleanName);
                        }
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch dynamic model list from Google, using static list.", e);
            }
        }

        // Remove duplicates and sort
        const uniqueModels = [...new Set(allModels)].sort((a, b) => b.localeCompare(a));

        return NextResponse.json(uniqueModels);

    } catch (error) {
        console.error('Failed to handle models route:', error);
        return NextResponse.json(allModels); // Fallback to static list
    }
}
