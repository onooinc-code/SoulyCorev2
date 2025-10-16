import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In a real scenario, this might use the server-side SDK to list available models.
// For this project, we return a curated list of recommended and supported models.
const recommendedModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-native-audio-preview-09-2025',
];

export async function GET(req: NextRequest) {
    try {
        return NextResponse.json(recommendedModels);
    } catch (error) {
        console.error('Failed to fetch models:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}