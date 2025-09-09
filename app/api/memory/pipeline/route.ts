import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { MemoryExtractionPipeline } from '@/core/pipelines/memory_extraction';

async function serverLog(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${payload ? JSON.stringify(payload) : null}, ${level});
        `;
    } catch (e) {
        console.error("Failed to write log to database:", e);
        console.log(`[${level.toUpperCase()}] ${message}`, payload || '');
    }
}


export async function POST(req: NextRequest) {
    try {
        const { textToAnalyze, aiMessageId } = await req.json();

        if (!textToAnalyze || !aiMessageId) {
            await serverLog('V2 Memory pipeline called with missing data.', { textToAnalyze, aiMessageId }, 'warn');
            return NextResponse.json({ error: 'textToAnalyze and aiMessageId are required' }, { status: 400 });
        }

        // --- V2 Pipeline Logging: Start ---
         const { rows: runRows } = await sql`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${aiMessageId}, 'MemoryExtraction', 'running')
            RETURNING id;
        `;
        const runId = runRows[0].id;
        // --- V2 Pipeline Logging: End ---

        // 1. Instantiate the new Memory Extraction Pipeline
        const extractionPipeline = new MemoryExtractionPipeline();

        // 2. Execute the pipeline (fire-and-forget, no need to await for UI response)
        extractionPipeline.extractAndStore({ textToAnalyze, runId }).then(() => {
             serverLog('V2 Memory pipeline processing completed in background.', { textLength: textToAnalyze.length });
        }).catch(pipelineError => {
             const errorDetails = {
                message: (pipelineError as Error).message,
                stack: (pipelineError as Error).stack,
            };
            console.error('Error in background memory pipeline execution:', pipelineError);
            serverLog('Critical error in V2 memory pipeline background execution.', { error: errorDetails }, 'error');
        });
        
        // Respond to the client immediately
        return NextResponse.json({
            message: 'Memory pipeline execution initiated successfully in the background.',
        });

    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        console.error('Error in memory pipeline API route:', error);
        await serverLog('Critical error in memory pipeline API route.', { error: errorDetails }, 'error');
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}