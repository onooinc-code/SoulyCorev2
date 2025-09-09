
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AgentRun, AgentRunStep, AgentPlanPhase } from '@/lib/types';
import { GoogleGenAI, Type } from "@google/genai";
import { generateChatResponse } from '@/lib/gemini-server';

export const dynamic = 'force-dynamic';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key not found.");
  }
  return new GoogleGenAI({ apiKey });
};
// @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
const modelName = 'gemini-2.5-flash';

// GET all runs
export async function GET() {
    try {
        const { rows } = await sql<AgentRun>`SELECT * FROM agent_runs ORDER BY "createdAt" DESC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch agent runs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Executes the agent run in the background without being awaited by the main request handler.
 * @param runId - The ID of the agent run to execute.
 * @param goal - The overall goal of the run.
 * @param savedPhases - The array of plan phases to be executed.
 */
async function executeRunInBackground(runId: string, goal: string, savedPhases: AgentPlanPhase[]) {
    const runStartTime = new Date( (await sql`SELECT "createdAt" FROM agent_runs WHERE id = ${runId}`).rows[0].createdAt ).getTime();
    
    try {
        let stepOrder = 1;
        const phaseResults: string[] = [];

        for (const phase of savedPhases) {
            await sql`
                UPDATE agent_run_phases SET status = 'running', started_at = CURRENT_TIMESTAMP WHERE id = ${phase.id};
            `;

            const thought = `I need to complete the current phase's goal: "${phase.goal}". I will send this goal to the AI assistant for execution.`;
            const actionType = 'send_prompt';
            const actionInput = { input: phase.goal };

            const assistantResponse = await generateChatResponse([{ role: 'user', parts: [{ text: phase.goal }] }], 'You are a helpful assistant executing a task.');
            const observation = assistantResponse?.text || 'No response from assistant.';
            
            phaseResults.push(observation);

            await sql<AgentRunStep>`
                INSERT INTO agent_run_steps (run_id, phase_id, step_order, thought, action_type, action_input, observation)
                VALUES (${runId}, ${phase.id}, ${stepOrder++}, ${thought}, ${actionType}, ${JSON.stringify(actionInput)}, ${observation});
            `;

            await sql`
                UPDATE agent_run_phases 
                SET status = 'completed', result = ${observation}, completed_at = CURRENT_TIMESTAMP 
                WHERE id = ${phase.id};
            `;
        }

        const finalResult = `Execution completed. Results from each phase:\n\n` + 
            phaseResults.map((res, index) => `--- Phase ${index + 1} Result ---\n${res}`).join('\n\n');
        
        const duration = Date.now() - runStartTime;
        
        await sql<AgentRun>`
            UPDATE agent_runs 
            SET status = 'completed', final_result = ${finalResult}, "completedAt" = CURRENT_TIMESTAMP, duration_ms = ${duration}
            WHERE id = ${runId};
        `;
        
    } catch (error) {
        console.error('Background agent run failed:', error);
        const duration = Date.now() - runStartTime;
        if (runId) {
            await sql`
                UPDATE agent_runs 
                SET status = 'failed', final_result = ${(error as Error).message}, "completedAt" = CURRENT_TIMESTAMP, duration_ms = ${duration}
                WHERE id = ${runId};
            `;
        }
    }
}


// POST to create and execute a new run based on a plan
export async function POST(req: NextRequest) {
    const { goal, plan } = await req.json();
    if (!goal || !plan) {
        return NextResponse.json({ error: 'Goal and plan are required' }, { status: 400 });
    }

    try {
        // 1. Create the main agent_runs record, starting in 'running' state
        const { rows: runRows } = await sql<AgentRun>`
            INSERT INTO agent_runs (goal, status) VALUES (${goal}, 'running') RETURNING *;
        `;
        const initialRun = runRows[0];
        const runId = initialRun.id;

        // 2. Insert all the planned phases into the database
        const phasePromises = plan.map((p: Omit<AgentPlanPhase, 'id' | 'run_id'>) => 
            sql`
                INSERT INTO agent_run_phases (run_id, phase_order, goal, status)
                VALUES (${runId}, ${p.phase_order}, ${p.goal}, 'pending')
            `
        );
        await Promise.all(phasePromises);

        // 3. Fetch the newly created phases to get their IDs for the background task
        const { rows: savedPhases } = await sql<AgentPlanPhase>`
            SELECT * FROM agent_run_phases WHERE run_id = ${runId} ORDER BY phase_order ASC;
        `;

        // 4. Start the execution in the background (fire-and-forget)
        executeRunInBackground(runId, goal, savedPhases);

        // 5. Return the initial run object to the client immediately
        // 202 Accepted is the correct status code for starting an async process.
        return NextResponse.json(initialRun, { status: 202 });

    } catch (error) {
        console.error('Failed to initiate agent run:', error);
        return NextResponse.json({ error: 'Failed to initiate agent run', details: (error as Error).message }, { status: 500 });
    }
}
