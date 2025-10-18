import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET() {
    try {
        const { rows } = await sql<Conversation>`
            SELECT * FROM conversations ORDER BY "lastUpdatedAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}

// POST a new conversation
export async function POST(req: NextRequest) {
    try {
        const { title, systemPrompt, model, temperature, topP } = await req.json();

        // Fetch default settings
        const { rows: settingsRows } = await sql`SELECT value FROM settings WHERE key = 'defaultModelConfig' OR key = 'defaultAgentConfig' OR key = 'featureFlags';`;
        const defaultModelConfig = settingsRows.find(r => r.key === 'defaultModelConfig')?.value || {};
        const defaultAgentConfig = settingsRows.find(r => r.key === 'defaultAgentConfig')?.value || {};
        const featureFlags = settingsRows.find(r => r.key === 'featureFlags')?.value || {};

        const { rows } = await sql<Conversation>`
            INSERT INTO conversations (
                title, "systemPrompt", model, temperature, "topP",
                "enableMemoryExtraction", "enableProactiveSuggestions", "enableAutoSummarization"
            ) VALUES (
                ${title || 'New Conversation'},
                ${systemPrompt || defaultAgentConfig.systemPrompt || 'You are a helpful AI assistant.'},
                ${model || defaultModelConfig.model || 'gemini-2.5-flash'},
                ${temperature === null || temperature === undefined ? defaultModelConfig.temperature || 0.7 : temperature},
                ${topP === null || topP === undefined ? defaultModelConfig.topP || 0.95 : topP},
                ${featureFlags.enableMemoryExtraction ?? true},
                ${featureFlags.enableProactiveSuggestions ?? true},
                ${featureFlags.enableAutoSummarization ?? true}
            )
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
