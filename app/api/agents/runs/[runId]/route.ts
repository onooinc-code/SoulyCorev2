
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AgentRun, AgentRunStep, AgentPlanPhase } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET a single run's details and steps
export async function GET(req: NextRequest, { params }: { params: { runId: string } }) {
    try {
        const { runId } = params;

        const { rows: runRows } = await sql<AgentRun>`
            SELECT * FROM agent_runs WHERE id = ${runId};
        `;
        if (runRows.length === 0) {
            return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
        }
        
        const { rows: phaseRows } = await sql<AgentPlanPhase>`
            SELECT * FROM agent_run_phases WHERE run_id = ${runId} ORDER BY phase_order ASC;
        `;
        
        const { rows: stepRows } = await sql<AgentRunStep>`
            SELECT * FROM agent_run_steps WHERE run_id = ${runId} ORDER BY step_order ASC;
        `;

        return NextResponse.json({
            run: runRows[0],
            phases: phaseRows,
            steps: stepRows
        });

    } catch (error) {
        console.error(`Failed to fetch agent run ${params.runId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}