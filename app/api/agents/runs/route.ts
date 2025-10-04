

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { AgentRun, AgentRunStep, AgentPlanPhase, Tool as DbTool } from '@/lib/types';
import { GoogleGenAI, Type, Content, Tool, FunctionDeclaration } from "@google/genai";
import { generateAgentContent } from '@/lib/gemini-server';

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
 * Simulates the execution of a tool. In a real-world scenario, this would
 * dispatch to an actual function execution engine.
 * @param toolCall - The function call object from the Gemini response.
 * @returns A string observation of the tool's result.
 */
function executeTool(toolCall: { name: string, args: any }): string {
    console.log(`Simulating execution of tool: ${toolCall.name}`, toolCall.args);
    // Add more simulated tools here as needed.
    switch (toolCall.name) {
        case 'web_search':
            return `Successfully searched for '${toolCall.args.query}'. Found 3 relevant articles on AI frameworks.`;
        case 'code_interpreter':
            return `Successfully executed Python code. Result: ${JSON.stringify({ output: "Hello, World!" })}`;
        default:
            return `Tool '${toolCall.name}' executed successfully with provided arguments.`;
    }
}


/**
 * Executes the agent's ReAct loop in the background.
 * @param runId - The ID of the agent run to execute.
 * @param goal - The overall goal of the run.
 * @param savedPhases - The array of plan phases to be executed.
 */
async function executeRunInBackground(runId: string, goal: string, savedPhases: AgentPlanPhase[]) {
    const runStartTime = new Date( (await sql`SELECT "createdAt" FROM agent_runs WHERE id = ${runId}`).rows[0].createdAt ).getTime();
    
    try {
        // 1. Fetch available tools and prepare them for the Gemini API
        const { rows: toolRows } = await sql<DbTool>`SELECT * FROM tools;`;
        const functionDeclarations: FunctionDeclaration[] = toolRows.map(t => ({
            name: t.name,
            description: t.description || '',
            parameters: typeof t.schema_json === 'string' ? JSON.parse(t.schema_json) : t.schema_json,
        }));
        const tools: Tool[] = functionDeclarations.length > 0 ? [{ functionDeclarations }] : [];

        let stepOrder = 1;
        const phaseResults: string[] = [];

        // 2. Loop through each high-level phase defined in the plan
        for (const phase of savedPhases) {
            await sql`
                UPDATE agent_run_phases SET status = 'running', started_at = CURRENT_TIMESTAMP WHERE id = ${phase.id};
            `;

            let phaseHistory: Content[] = [];
            let phaseComplete = false;
            const MAX_STEPS_PER_PHASE = 10;

            // 3. Start the inner ReAct loop for the current phase
            for (let i = 0; i < MAX_STEPS_PER_PHASE; i++) {
                // a. REASON: Ask the model to think and decide on the next action
                const systemInstruction = `You are an autonomous agent executing a plan.
Your overall goal is: "${goal}"
You are currently working on this phase: "${phase.goal}"
Your task is to use the available tools to achieve this phase's goal.

1. **Think:** First, provide a brief 'thought' process explaining your reasoning and plan for the next action.
2. **Act:** Then, choose ONE of two actions:
   - Call one of the available tools to gather information or perform an action.
   - If you have enough information to complete the phase's goal, provide the final answer directly as text.`;
                
                const agentResponse = await generateAgentContent(phaseHistory, systemInstruction, tools);
                
                if (!agentResponse) throw new Error("Agent failed to generate a response.");

                const thought = agentResponse.text || "No thought provided."; // Assume any text is the 'thought'

                // b. ACT: Check if the model chose to use a tool or provide a final answer
                if (agentResponse.functionCalls && agentResponse.functionCalls.length > 0) {
                    const toolCall = agentResponse.functionCalls[0];
                    
                    // FIX: Add a guard to ensure toolCall.name is defined before proceeding.
                    if (!toolCall.name) {
                        throw new Error("Agent response contained a tool call with no name.");
                    }
                    
                    const observation = executeTool({ name: toolCall.name, args: toolCall.args });
                    
                    // c. LOG the tool step
                    await sql<AgentRunStep>`
                        INSERT INTO agent_run_steps (run_id, phase_id, step_order, thought, action_type, action_input, observation)
                        VALUES (${runId}, ${phase.id}, ${stepOrder++}, ${thought}, 'tool', ${JSON.stringify({name: toolCall.name, args: toolCall.args})}, ${observation});
                    `;

                    // d. LOOP: Add the tool call and its result (observation) to the history for the next iteration
                    phaseHistory.push({ role: 'model', parts: [{ functionCall: toolCall }] });
                    phaseHistory.push({ role: 'user', parts: [{ functionResponse: { name: toolCall.name, response: { content: observation } } }] });

                } else {
                    // The model provided a final answer for the phase
                    const finalAnswerForPhase = agentResponse.text || '';
                    phaseResults.push(finalAnswerForPhase);

                    // c. LOG the final step for this phase
                    await sql<AgentRunStep>`
                        INSERT INTO agent_run_steps (run_id, phase_id, step_order, thought, action_type, observation)
                        VALUES (${runId}, ${phase.id}, ${stepOrder++}, ${thought}, 'finish', ${finalAnswerForPhase});
                    `;
                    
                    await sql`
                        UPDATE agent_run_phases SET status = 'completed', result = ${finalAnswerForPhase}, completed_at = CURRENT_TIMESTAMP WHERE id = ${phase.id};
                    `;
                    phaseComplete = true;
                    break; // Exit the ReAct loop for this phase
                }
            }

            if (!phaseComplete) {
                throw new Error(`Agent failed to complete phase ${phase.phase_order} within the maximum step limit.`);
            }
        }

        // 4. Finalize the overall run
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