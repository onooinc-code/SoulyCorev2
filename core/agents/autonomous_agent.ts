// core/agents/autonomous_agent.ts
import { sql } from '@/lib/db';
import { generateAgentContent } from '@/lib/gemini-server';
import { executeTool } from '@/core/tools';
import type { AgentRun, AgentPlanPhase, AgentRunStep, Tool } from '@/lib/types';
import { ExperienceConsolidationPipeline } from '../pipelines/experience_consolidation';
import { Content, Tool as GeminiTool, FunctionDeclaration, Type } from '@google/genai';

export class AutonomousAgent {
    private runId: string;
    private goal: string;
    private plan: Omit<AgentPlanPhase, 'id' | 'run_id' | 'steps' | 'result' | 'started_at' | 'completed_at'>[];

    constructor(runId: string, goal: string, plan: any[]) {
        this.runId = runId;
        this.goal = goal;
        this.plan = plan;
    }

    async run() {
        // This is a fire-and-forget method to run the agent in the background.
        this.execute().catch(async (error) => {
            console.error(`Agent run ${this.runId} failed:`, error);
            await sql`
                UPDATE agent_runs SET status = 'failed', result_summary = ${(error as Error).message}, "completedAt" = CURRENT_TIMESTAMP WHERE id = ${this.runId};
            `;
        });
    }

    private async execute() {
        let finalResult = '';
        for (const phase of this.plan) {
            const { rows: phaseRows } = await sql`
                INSERT INTO agent_run_phases (run_id, phase_order, goal, status, started_at)
                VALUES (${this.runId}, ${phase.phase_order}, ${phase.goal}, 'running', CURRENT_TIMESTAMP)
                RETURNING id;
            `;
            const phaseId = phaseRows[0].id;
            
            try {
                const phaseResult = await this.executePhase(phase, phaseId);
                await sql`
                    UPDATE agent_run_phases SET status = 'completed', result = ${phaseResult}, completed_at = CURRENT_TIMESTAMP WHERE id = ${phaseId};
                `;
                finalResult += `Phase ${phase.phase_order} Result: ${phaseResult}\n`;
            } catch (error) {
                 await sql`
                    UPDATE agent_run_phases SET status = 'failed', result = ${(error as Error).message}, completed_at = CURRENT_TIMESTAMP WHERE id = ${phaseId};
                `;
                throw error; // Propagate error to stop the main run
            }
        }

        await sql`
            UPDATE agent_runs SET status = 'completed', result_summary = ${finalResult}, "completedAt" = CURRENT_TIMESTAMP WHERE id = ${this.runId};
        `;
        
        // Fire-and-forget experience consolidation
        new ExperienceConsolidationPipeline().run(this.runId);
    }

    private async executePhase(phase: any, phaseId: string): Promise<string> {
        const MAX_STEPS = 10;
        const stepHistory: AgentRunStep[] = [];

        // 1. Fetch available tools from the database
        const { rows: toolRows } = await sql<Tool>`SELECT name, description, schema_json FROM tools;`;
        const finishTool: FunctionDeclaration = {
            name: 'finish',
            description: 'Call this function when you have successfully completed the current phase goal and have the final answer.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    result: {
                        type: Type.STRING,
                        description: 'The final result or summary of the completed phase goal.'
                    }
                },
                required: ['result']
            }
        };

        const availableTools: GeminiTool[] = [{
            functionDeclarations: [...toolRows.map(t => t.schema_json), finishTool]
        }];

        for (let i = 1; i <= MAX_STEPS; i++) {
            // 2. REASON
            const historyForPrompt: Content[] = [{
                role: 'user',
                parts: [{ text: `
                    OVERALL GOAL: "${this.goal}"
                    CURRENT PHASE GOAL: "${phase.goal}"

                    PREVIOUS STEPS IN THIS PHASE:
                    ${stepHistory.length > 0 ? stepHistory.map(s => `Thought: ${s.thought}\nAction: ${s.action}(${JSON.stringify(s.action_input)})\nObservation: ${s.observation}`).join('\n---\n') : "No steps taken yet."}

                    Your task is to decide the next logical step to achieve the current phase goal.
                    Based on the goal and history, formulate a 'thought' about what to do next, then choose one of the available tools to execute.
                    If you have sufficient information to answer the phase goal, call the 'finish' tool.
                    Your response should include your thought process as text and a 'functionCall' to a tool.
                `}]
            }];

            const systemInstruction = "You are an autonomous agent executing a plan. Your response must include your thought process and a function call to one of the available tools.";
            const response = await generateAgentContent(historyForPrompt, systemInstruction, availableTools);

            const thoughtText = response.text?.trim() || "The model did not provide a thought. Proceeding with action.";
            const functionCall = response.functionCalls?.[0];

            if (!functionCall) {
                if(thoughtText) {
                     return thoughtText;
                }
                throw new Error("Agent failed to produce a valid tool call or text response.");
            }
            
            // 3. ACT
            if (functionCall.name === 'finish') {
                return functionCall.args.result as string;
            }

            const { rows: stepRows } = await sql<AgentRunStep>`
                INSERT INTO agent_run_steps (run_id, phase_id, step_order, thought, action, action_input, observation, status)
                VALUES (${this.runId}, ${phaseId}, ${i}, ${thoughtText}, ${functionCall.name}, ${JSON.stringify(functionCall.args)}, '', 'running')
                RETURNING id;
            `;
            const stepId = stepRows[0].id;
            
            const observation = await executeTool(functionCall.name, functionCall.args);
            
            // 4. OBSERVE
            await sql`
                UPDATE agent_run_steps SET observation = ${observation}, status = 'completed' WHERE id = ${stepId};
            `;

            const newStep: any = {
                id: stepId,
                thought: thoughtText,
                action: functionCall.name,
                action_input: functionCall.args,
                observation: observation,
            };
            stepHistory.push(newStep);
        }

        throw new Error("Agent exceeded maximum number of steps for this phase.");
    }
}
