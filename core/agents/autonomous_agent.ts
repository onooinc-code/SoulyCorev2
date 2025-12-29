
// core/agents/autonomous_agent.ts
import { sql } from '@/lib/db';
import { executeTool } from '../tools';
import type { AgentPlanPhase } from '@/lib/types';
import { ExperienceConsolidationPipeline } from '../pipelines/experience_consolidation';
import { GoogleGenAI } from '@google/genai';

const MAX_STEPS_PER_PHASE = 10;

export class AutonomousAgent {
    private runId: string;
    private mainGoal: string;
    private plan: Omit<AgentPlanPhase, 'id' | 'run_id' | 'steps' | 'result' | 'started_at' | 'completed_at'>[];
    private ai: GoogleGenAI;
    private memory: string[] = [];

    constructor(runId: string, mainGoal: string, plan: any[]) {
        this.runId = runId;
        this.mainGoal = mainGoal;
        this.plan = plan;

        // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
             throw new Error("AutonomousAgent: API Key not found in environment variables.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    public async run() {
        console.log(`[AgentRun ${this.runId}] Starting run with goal: ${this.mainGoal}`);
        try {
            for (const phaseDef of this.plan) {
                await this.executePhase(phaseDef);
            }
            const finalResult = `Successfully completed all phases for the goal: ${this.mainGoal}. Final thoughts: ${this.memory.join('\n')}`;
            await this.finalizeRun('completed', finalResult);

            // Fire-and-forget experience consolidation
            new ExperienceConsolidationPipeline().run(this.runId);

        } catch (error) {
            const errorMessage = `[AgentRun ${this.runId}] Run failed: ${(error as Error).message}`;
            console.error(errorMessage, (error as Error).stack);
            await this.finalizeRun('failed', errorMessage);
        }
    }

    private async executePhase(phaseDef: Omit<AgentPlanPhase, 'id' | 'run_id' | 'steps' | 'result' | 'started_at' | 'completed_at'>) {
        // 1. Create phase record in DB
        const { rows: phaseRows } = await sql<AgentPlanPhase>`
            INSERT INTO agent_run_phases ("runId", "phaseOrder", goal, status, "startedAt")
            VALUES (${this.runId}, ${phaseDef.phaseOrder}, ${phaseDef.goal}, 'running', NOW())
            RETURNING id;
        `;
        const phaseId = phaseRows[0].id;
        console.log(`[AgentRun ${this.runId}] Starting Phase ${phaseDef.phaseOrder}: ${phaseDef.goal}`);

        let stepCount = 0;
        let lastObservation = "No observation yet. Begin by thinking about the first step to achieve your goal.";

        while (stepCount < MAX_STEPS_PER_PHASE) {
            stepCount++;
            
            // 2. Generate thought and action
            const { thought, action, action_input, is_final_answer } = await this.generateNextStep(phaseId, phaseDef.goal, lastObservation);

            // 3. Log the step (thought process)
            const { rows: stepRows } = await sql`
                INSERT INTO agent_run_steps ("runId", "phaseId", "stepOrder", thought, action, "actionInput", observation, status, "startedAt")
                VALUES (${this.runId}, ${phaseId}, ${stepCount}, ${thought}, ${action}, ${JSON.stringify(action_input)}, '', 'running', NOW())
                RETURNING id;
            `;
            const stepId = stepRows[0].id;

            if (is_final_answer) {
                await this.finalizePhase(phaseId, 'completed', action_input.final_answer);
                return;
            }

            // 4. Execute the tool/action
            const observation = await executeTool(action, action_input);
            lastObservation = observation;

            // 5. Update step with observation
            await sql`
                UPDATE agent_run_steps 
                SET observation = ${observation}, status = 'completed', "completedAt" = NOW()
                WHERE id = ${stepId};
            `;
        }

        // FIX: Use camelCase property to match type definition.
        throw new Error(`Phase ${phaseDef.phaseOrder} exceeded max steps.`);
    }

    private async generateNextStep(phaseId: string, phaseGoal: string, lastObservation: string): Promise<{ thought: string, action: string, action_input: any, is_final_answer: boolean }> {
        const prompt = `
            You are an autonomous agent executing a phase of a larger plan.
            Your Main Goal: ${this.mainGoal}
            Current Phase Goal: ${phaseGoal}
            
            Available Tools: web_search, calculator

            Your Memory (previous phase results):
            ${this.memory.join('\n') || 'None'}
            
            Last Observation:
            ${lastObservation}

            Based on the above, decide your next thought and action.
            If you have sufficient information to complete the current phase goal, your action should be 'final_answer' with the answer in 'final_answer' argument.
            Respond with a single JSON object with "thought", "action", and "action_input" keys. "action_input" must be an object.
        `;
        
        const result = await this.ai.models.generateContent({
            // @google/genai-api-guideline-fix: Use 'gemini-3-flash-preview' for general agent decision tasks.
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        try {
            // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
            if (!result.text) {
                throw new Error("AI response text is empty.");
            }
            const responseJson = JSON.parse(result.text.trim().replace(/```json|```/g, ''));
            const isFinal = responseJson.action === 'final_answer';
            return {
                thought: responseJson.thought,
                action: responseJson.action,
                action_input: responseJson.action_input,
                is_final_answer: isFinal
            };
        } catch (e) {
            // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
            console.error("Failed to parse agent's JSON response:", result.text ?? "Response was empty");
            return {
                thought: "I failed to generate a valid JSON response. I will try again.",
                action: "final_answer",
                action_input: { final_answer: "Error: Could not decide on an action." },
                is_final_answer: true,
            };
        }
    }
    
    private async finalizePhase(phaseId: string, status: 'completed' | 'failed', result: string) {
        await sql`
            UPDATE agent_run_phases
            SET status = ${status}, result = ${result}, "completedAt" = NOW()
            WHERE id = ${phaseId};
        `;
        if (status === 'completed') {
            this.memory.push(result);
        }
        console.log(`[AgentRun ${this.runId}] Finalized Phase. Status: ${status}. Result: ${result}`);
    }

    private async finalizeRun(status: 'completed' | 'failed', resultSummary: string) {
        await sql`
            UPDATE agent_runs
            SET status = ${status}, result_summary = ${resultSummary}, "completedAt" = NOW()
            WHERE id = ${this.runId};
        `;
        console.log(`[AgentRun ${this.runId}] Finalized Run. Status: ${status}`);
    }
}
