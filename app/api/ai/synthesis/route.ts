
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        // 1. Gather context from top memory tiers
        const [recentFacts, topEntities] = await Promise.all([
            sql`SELECT text FROM pipeline_runs WHERE "pipelineType" = 'MemoryExtraction' ORDER BY "createdAt" DESC LIMIT 10`,
            sql`SELECT name, description FROM entity_definitions ORDER BY "accessCount" DESC LIMIT 10`
        ]);

        const synthesisPrompt = `
            You are Souly's Cognitive Synthesis Engine. 
            Review the following recent knowledge updates and top entities:
            
            RECENT FACTS:
            ${recentFacts.rows.map(r => r.text).join('\n')}
            
            TOP ENTITIES:
            ${topEntities.rows.map(e => `${e.name}: ${e.description}`).join('\n')}
            
            Based on this, generate a comprehensive "Knowledge Nexus Report" in HTML format.
            Include:
            1. Current state of understanding.
            2. Emerging patterns or relationships.
            3. Recommendations for further research or memory cleanup.
            Use professional, technical tone. Use Mermaid.js if you want to show relationships.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: synthesisPrompt,
        });

        const htmlReport = response.text || '<h1>Synthesis Failed</h1>';
        
        // 2. Save the report to the reports directory
        // FIX: Replaced `process.cwd()` with `path.resolve()` to fix TypeScript error where 'cwd' is not found on 'Process' type and ensure compatibility across environments.
        const reportPath = path.join(path.resolve(), 'reports', `ResponseTemplate-Synthesis-${Date.now()}.html`);
        await fs.writeFile(reportPath, htmlReport);

        return NextResponse.json({ success: true, report: reportPath });
    } catch (error) {
        console.error('Synthesis failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
