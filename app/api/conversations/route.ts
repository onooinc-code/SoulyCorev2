
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Conversation, AppSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all conversations with stats
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const segmentId = searchParams.get('segmentId');

        let rows;
        if (segmentId) {
             // Logic for segment filtering if needed
             const result = await sql`
                SELECT c.*, 
                       COUNT(m.id)::int as "messageCount", 
                       COALESCE(SUM(m."tokenCount"), 0)::int as "tokenCount"
                FROM conversations c
                LEFT JOIN messages m ON c.id = m."conversationId"
                JOIN message_segments ms ON m.id = ms."messageId"
                WHERE ms."segmentId" = ${segmentId}
                GROUP BY c.id
                ORDER BY c."lastUpdatedAt" DESC;
            `;
            rows = result.rows;
        } else {
            // Enhanced query to get message counts and token sums
            const result = await sql`
                SELECT c.*, 
                       COUNT(m.id)::int as "messageCount", 
                       COALESCE(SUM(m."tokenCount"), 0)::int as "tokenCount"
                FROM conversations c
                LEFT JOIN messages m ON c.id = m."conversationId"
                GROUP BY c.id
                ORDER BY c."lastUpdatedAt" DESC;
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
        const body = await req.json().catch(() => ({})); // Handle empty body safely
        let title = body.title;
        
        if (!title) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            title = `محادثة جديدة - ${dateStr} ${timeStr}`;
        }
        
        // 1. Fetch Global Settings to get defaults
        const { rows: settingsRows } = await sql`
            SELECT value FROM settings WHERE "key" = 'app_settings';
        `;

        // @google/genai-api-guideline-fix: Use 'gemini-3-flash-preview' for basic text tasks.
        let defaultModelConfig = {
            model: 'gemini-3-flash-preview',
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
                ${title},
                ${defaultAgentConfig.systemPrompt},
                ${defaultModelConfig.model},
                ${defaultModelConfig.temperature},
                ${defaultModelConfig.topP},
                ${defaultAgentConfig.useSemanticMemory},
                ${defaultAgentConfig.useStructuredMemory},
                ${null}
            ) RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
