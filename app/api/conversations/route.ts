
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import { Conversation, AppSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const segmentId = searchParams.get('segmentId');

        let rows;
        if (segmentId) {
            const result = await sql<Conversation>`
                SELECT DISTINCT c.* 
                FROM conversations c
                JOIN messages m ON c.id = m."conversationId"
                JOIN message_segments ms ON m.id = ms."messageId"
                WHERE ms."segmentId" = ${segmentId}
                ORDER BY c."lastUpdatedAt" DESC;
            `;
            rows = result.rows;
        } else {
            const result = await sql<Conversation>`
                SELECT * FROM conversations ORDER BY "lastUpdatedAt" DESC;
            `;
            rows = result.rows;
        }
        
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new conversation
export async function POST(req: NextRequest) {
    try {
        const { title } = await req.json();
        
        // 1. Fetch Global Settings to get defaults
        const { rows: settingsRows } = await sql`
            SELECT value FROM settings WHERE "key" = 'app_settings';
        `;

        let defaultModelConfig = {
            model: 'gemini-2.5-flash',
            temperature: 0.7,
            topP: 0.95
        };
        
        let defaultAgentConfig = {
            systemPrompt: 'You are a helpful AI assistant.',
            useSemanticMemory: true,
            useStructuredMemory: true,
            brainId: null as string | null
        };

        if (settingsRows.length > 0) {
            const appSettings = settingsRows[0].value as AppSettings;
            if (appSettings.defaultModelConfig) {
                defaultModelConfig = { ...defaultModelConfig, ...appSettings.defaultModelConfig };
            }
            if (appSettings.defaultAgentConfig) {
                defaultAgentConfig = { ...defaultAgentConfig, ...appSettings.defaultAgentConfig };
            }
        }

        // 2. Insert new conversation with these defaults applied
        const { rows } = await sql<Conversation>`
            INSERT INTO conversations (
                title, 
                "systemPrompt", 
                model, 
                temperature, 
                "topP", 
                "useSemanticMemory", 
                "useStructuredMemory",
                "brainId"
            ) VALUES (
                ${title || 'New Chat'},
                ${defaultAgentConfig.systemPrompt},
                ${defaultModelConfig.model},
                ${defaultModelConfig.temperature},
                ${defaultModelConfig.topP},
                ${defaultAgentConfig.useSemanticMemory},
                ${defaultAgentConfig.useStructuredMemory},
                ${null} -- Brain ID is typically explicitly set, or could be added to defaultAgentConfig later
            ) RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
