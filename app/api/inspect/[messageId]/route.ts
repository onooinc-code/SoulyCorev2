import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const { messageId } = params;

        // 1. Find the pipeline run associated with this message
        const { rows: runRows } = await sql`
            SELECT * FROM pipeline_runs WHERE message_id = ${messageId} LIMIT 1;
        `;

        if (runRows.length === 0) {
            return NextResponse.json({
                pipelineRun: { 
                    final_output: 'No pipeline run found for this message. This may be an older message, a message generated from a regeneration, or the pipeline is still running.',
                    pipeline_type: 'N/A',
                    status: 'not_found'
                },
                pipelineSteps: [],
            });
        }
        
        const pipelineRun = runRows[0];

        // 2. Find the steps for that run
        const { rows: stepRows } = await sql`
            SELECT * FROM pipeline_run_steps WHERE run_id = ${pipelineRun.id} ORDER BY step_order ASC;
        `;
        
        // Sanitize sensitive info if needed in the future
        const { final_llm_prompt, final_system_instruction, model_config_json, ...restOfRun } = pipelineRun;

        return NextResponse.json({
            pipelineRun: {
                ...restOfRun,
                final_llm_prompt,
                final_system_instruction,
                model_config_json,
            },
            pipelineSteps: stepRows,
        });

    } catch (error) {
        console.error(`Failed to fetch inspection data for message ${params.messageId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}