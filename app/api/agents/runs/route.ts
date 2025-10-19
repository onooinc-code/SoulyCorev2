// app/api/agents/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AgentRun, AgentPlanPhase } from '@/lib/types';
import { AutonomousAgent } from '@/core/agents/autonomous_agent';

export const dynamic = 'force-dynamic';

// GET all agent runs
export async function GET() {
    try {
        const { rows } = await sql<AgentRun>`
            SELECT id, goal, status, "createdAt" 
            FROM agent_runs 
            ORDER BY "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch agent runs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST to create and start a new agent run
export async function POST(req: NextRequest) {
    try {
        const { goal, plan } = await req.json();

        if (!goal || !plan) {
            return NextResponse.json({ error: 'goal and plan are required' }, { status: 400 });
        }

        // 1. Create the main run record
        const { rows: runRows } = await sql<AgentRun>`
            INSERT INTO agent_runs (goal, status, "createdAt")
            VALUES (${goal}, 'running', NOW())
            RETURNING *;
        `;
        const newRun = runRows[0];
        
        // 2. Start the agent in the background (fire-and-forget)
        const agent = new AutonomousAgent(newRun.id, newRun.goal, plan);
        agent.run().catch(err => {
            console.error(`[BACKGROUND AGENT ERROR] Run ID ${newRun.id} failed:`, err);
            // The agent itself should update its status to 'failed' in the DB.
        });

        // 3. Respond immediately to the client
        return NextResponse.json(newRun, { status: 202 });

    } catch (error) {
        console.error('Failed to create agent run:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}