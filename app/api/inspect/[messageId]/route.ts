
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;

        // Fetch all pipeline runs (ContextAssembly and MemoryExtraction) for this message
        const { rows: runRows } = await sql`
            SELECT * FROM pipeline_runs WHERE "messageId" = ${messageId} ORDER BY "createdAt" ASC;
        `;

        if (runRows.length === 0) {
            return NextResponse.json({
                pipelineRun: { 
                    finalOutput: 'No pipeline run found.',
                    pipelineType: 'N/A',
                    status: 'not_found'
                },
                allRuns: [],
                pipelineSteps: [],
            });
        }
        
        // Ensure the 'pipelineRun' returned for the inspector modal is primarily the 'ContextAssembly' run,
        // as that contains the prompt/system context.
        const contextRun = runRows.find(r => r.pipelineType === 'ContextAssembly') || runRows[0];

        // Fetch all steps for all runs associated with this message
        const runIds = runRows.map(r => r.id);
        const { rows: stepRows } = await sql`
            SELECT * FROM pipeline_run_steps WHERE "runId" = ANY(${runIds as any}) ORDER BY "runId", "stepOrder" ASC;
        `;
        
        // Return structured data
        return NextResponse.json({
            pipelineRun: contextRun, // Primary run for Context Viewer
            allRuns: runRows,        // All runs for advanced analysis (Extraction button)
            pipelineSteps: stepRows,
        });

    } catch (error) {
        console.error(`Failed to fetch inspection data:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
