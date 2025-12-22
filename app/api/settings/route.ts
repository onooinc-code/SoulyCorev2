
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { AppSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'app_settings';

// Default settings as a fallback if nothing is in the DB
// @google/genai-api-guideline-fix: Use 'gemini-3-flash-preview' for basic text tasks.
const defaultSettings: AppSettings = {
    defaultModelConfig: {
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        topP: 0.95,
    },
    defaultAgentConfig: {
        systemPrompt: 'You are a helpful AI assistant.',
        useSemanticMemory: true,
        useStructuredMemory: true,
    },
    enableDebugLog: { enabled: true },
    featureFlags: {
        enableMemoryExtraction: true,
        enableProactiveSuggestions: true,
        enableAutoSummarization: true,
        enableReActAgent: false,
        enableLinkPrediction: true,
    },
    global_ui_settings: {
        fontSize: '16px',
        messageFontSize: 'base',
        theme: 'theme-dark',
    },
    entityGridSettings: {
        showDescription: true,
        showAliases: true,
        showTags: false,
    },
    savedEntityHubFilters: [],
    apiRouting: {
        main_response: 'gemini-3-flash-preview',
        memory_extraction: 'gemini-3-flash-preview',
        context_assembly: 'gemini-3-flash-preview',
        proactive_suggestions: 'gemini-3-flash-preview',
        synthesis: 'gemini-3-pro-preview',
        title_generation: 'gemini-3-flash-preview',
    }
};

// GET the application settings
export async function GET() {
    try {
        const { rows } = await sql`
            SELECT value FROM settings WHERE "key" = ${SETTINGS_KEY};
        `;
        if (rows.length > 0) {
            // Merge with defaults to ensure all keys are present
            const dbSettings = rows[0].value as Partial<AppSettings>;
            
            // A deep merge is safer here to handle nested objects like global_ui_settings
            const mergedSettings = { 
                ...defaultSettings, 
                ...dbSettings,
                defaultModelConfig: { ...defaultSettings.defaultModelConfig, ...dbSettings.defaultModelConfig },
                defaultAgentConfig: { ...defaultSettings.defaultAgentConfig, ...dbSettings.defaultAgentConfig },
                enableDebugLog: { ...defaultSettings.enableDebugLog, ...dbSettings.enableDebugLog },
                featureFlags: { ...defaultSettings.featureFlags, ...dbSettings.featureFlags },
                global_ui_settings: { ...defaultSettings.global_ui_settings, ...dbSettings.global_ui_settings },
                entityGridSettings: { ...defaultSettings.entityGridSettings, ...dbSettings.entityGridSettings },
                savedEntityHubFilters: dbSettings.savedEntityHubFilters ?? defaultSettings.savedEntityHubFilters,
                apiRouting: { ...defaultSettings.apiRouting, ...dbSettings.apiRouting },
            };
            return NextResponse.json(mergedSettings);
        }
        // If no settings in DB, return defaults
        return NextResponse.json(defaultSettings);
    } catch (error) {
        console.error('Failed to fetch settings, returning defaults:', error);
        // On error, still return defaults to allow app to function
        return NextResponse.json(defaultSettings);
    }
}

// PUT (update) the application settings
export async function PUT(req: NextRequest) {
    try {
        const newSettings = await req.json() as AppSettings;

        const { rows } = await sql`
            INSERT INTO settings ("key", "value", "lastUpdatedAt")
            VALUES (${SETTINGS_KEY}, ${JSON.stringify(newSettings)}::jsonb, CURRENT_TIMESTAMP)
            ON CONFLICT ("key") DO UPDATE SET
                value = EXCLUDED.value,
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            RETURNING value;
        `;
        
        return NextResponse.json(rows[0].value);
    } catch (error) {
        console.error('Failed to save settings:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
