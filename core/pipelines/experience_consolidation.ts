// core/pipelines/experience_consolidation.ts
import { sql } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";
import type { AgentRunStep } from '@/lib/types';

export class ExperienceConsolidationPipeline {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not found for ExperienceConsolidationPipeline.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async run(runId: string) {
        console.log(`[ExperienceConsolidation] Starting consolidation for runId: ${runId}`);
        try {
            // 1. Fetch run goal and steps
            const { rows: runRows } = await sql`SELECT goal FROM agent_runs WHERE id = ${runId}`;
            if (runRows.length === 0) throw new Error(`Agent run ${runId} not found.`);
            const goal = runRows[0].goal;

            const { rows: stepRows } = await sql<AgentRunStep>`
                SELECT "stepOrder", thought, action, observation FROM agent_run_steps 
                WHERE "runId" = ${runId} AND status = 'completed'
                ORDER BY "stepOrder" ASC;
            `;
            if (stepRows.length === 0) {
                console.log(`[ExperienceConsolidation] No completed steps found for run ${runId}. Aborting.`);
                return;
            }

            // 2. Format data for LLM analysis
            const formattedSteps = stepRows.map(s => 
                `Step ${s.stepOrder}:\n- Thought: ${s.thought}\n- Action: ${s.action}\n- Observation: ${s.observation}`
            ).join('\n\n');

            const prompt = `
                You are an expert system that analyzes AI agent execution logs to create generalized, reusable "experiences".
                Your task is to convert a specific, successful agent run into an abstract recipe.

                **Original Goal:**
                ${goal}

                **Execution Steps:**
                ${formattedSteps}

                **Your Task:**
                Based on the original goal and the steps taken, generate a JSON object representing a generalized experience.
                1.  **goal_template**: Create a generic version of the original goal, using placeholders like "{topic}" or "{entity_name}".
                2.  **trigger_keywords**: Provide an array of 5-7 lowercase keywords that would help find this experience for similar future goals.
                3.  **steps_json**: Create an abstract, simplified plan as a JSON array of objects. Each object should have a "step_goal" key describing the high-level objective of that step in the original run.

                The final output must be ONLY the valid JSON object.
            `;

            // 3. Call LLM to generate the experience object
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            goal_template: { type: Type.STRING },
                            trigger_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                            steps_json: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: { step_goal: { type: Type.STRING } },
                                    required: ['step_goal']
                                }
                            }
                        },
                        required: ['goal_template', 'trigger_keywords', 'steps_json']
                    }
                }
            });
            
            if (!response.text) {
                throw new Error("AI failed to generate experience data. The response was empty.");
            }
            
            const experienceData = JSON.parse(response.text.trim());

            // 4. Store the new experience in the database
            await sql`
                INSERT INTO experiences ("sourceRunId", "goalTemplate", "triggerKeywords", "stepsJson")
                VALUES (${runId}, ${experienceData.goal_template}, ${experienceData.trigger_keywords as any}, ${JSON.stringify(experienceData.steps_json)});
            `;
            console.log(`[ExperienceConsolidation] Successfully created and stored new experience from run ${runId}.`);

        } catch (error) {
            console.error(`[ExperienceConsolidation] Failed for runId ${runId}:`, error);
            // We don't re-throw, as this is a background process. Errors are just logged.
        }
    }
}