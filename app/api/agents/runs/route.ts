// app/api/agents/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AgentRun } from '@/lib/types';
import { AutonomousAgent } from '@/core/agents/autonomous_agent';

export const dynamic = 'force-dynamic';

// GET all runs
export async function GET() {
    try {
        const { rows } = await sql<AgentRun>`
            SELECT * FROM agent_runs ORDER BY "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST to create and start a new run
export async function POST(req: NextRequest) {
    try {
        const { goal, plan } = await req.json();

        if (!goal || !plan) {
            return NextResponse.json({ error: 'Goal and plan are required' }, { status: 400 });
        }

        const { rows } = await sql<AgentRun>`
            INSERT INTO agent_runs (goal, status)
            VALUES (${goal}, 'running')
            RETURNING *;
        `;
        
        const newRun = rows[0];
        
        // Start the agent in the background (fire-and-forget)
        const agent = new AutonomousAgent(newRun.id, goal, plan);
        agent.run(); // This method is async but we don't await it

        return NextResponse.json(newRun, { status: 202 }); // 202 Accepted
    } catch (error) {
        console.error('Failed to start agent run:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
