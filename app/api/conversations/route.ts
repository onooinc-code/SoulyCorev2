

import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET() {
    try {
        const { rows } = await sql<Conversation>`SELECT * FROM conversations ORDER BY "lastUpdatedAt" DESC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// POST a new conversation
export async function POST(req: NextRequest) {
    try {
        // FIX: Gracefully handle cases where the request body might be empty or not valid JSON.
        const body = await req.json().catch(() => ({ title: null }));
        const title = body?.title;
        const newTitle = title || 'New Chat';

        // Fetch default settings from the database
        const { rows: settingsRows } = await sql`SELECT key, value FROM settings WHERE key IN ('defaultModelConfig', 'defaultAgentConfig', 'featureFlags');`;
        
        const settings = settingsRows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);

        const modelConfig = settings.defaultModelConfig || { model: 'gemini-2.5-flash', temperature: 0.7, topP: 0.95 };
        const agentConfig = settings.defaultAgentConfig || { systemPrompt: 'You are a helpful AI assistant.', useSemanticMemory: true, useStructuredMemory: true };
        const featureFlags = settings.featureFlags || { enableMemoryExtraction: true, enableProactiveSuggestions: true, enableAutoSummarization: true };

        const query = `
            INSERT INTO conversations (
                title, "systemPrompt", "useSemanticMemory", "useStructuredMemory", 
                model, temperature, "topP",
                "enableMemoryExtraction", "enableProactiveSuggestions", "enableAutoSummarization"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const values = [
            newTitle,
            agentConfig.systemPrompt,
            agentConfig.useSemanticMemory,
            agentConfig.useStructuredMemory,
            modelConfig.model,
            modelConfig.temperature,
            modelConfig.topP,
            featureFlags.enableMemoryExtraction,
            featureFlags.enableProactiveSuggestions,
            featureFlags.enableAutoSummarization,
        ];

        const { rows } = await db.query(query, values);
        
        return NextResponse.json(rows[0] as Conversation, { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
