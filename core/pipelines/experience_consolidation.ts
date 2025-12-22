
// core/pipelines/experience_consolidation.ts
import { sql } from '@/lib/db';
import { GoogleGenAI, Type } from "@google/genai";
import { SemanticMemoryModule } from '../memory/modules/semantic';
import type { AgentRunStep } from '@/lib/types';

export class ExperienceConsolidationPipeline {
    private ai: GoogleGenAI;
    private semanticMemory: SemanticMemoryModule;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) throw new Error("API key not found.");
        this.ai = new GoogleGenAI({ apiKey });
        this.semanticMemory = new SemanticMemoryModule();
    }

    async run(runId: string) {
        try {
            const { rows: runRows } = await sql`SELECT goal FROM agent_runs WHERE id = ${runId}`;
            if (runRows.length === 0) return;
            const goal = runRows[0].goal;

            const { rows: stepRows } = await sql<AgentRunStep>`
                SELECT "stepOrder", thought, action, observation FROM agent_run_steps 
                WHERE "runId" = ${runId} AND status = 'completed' ORDER BY "stepOrder" ASC;
            `;
            if (stepRows.length === 0) return;

            const prompt = `Analyze this agent run for goal: "${goal}"
            1. Create a "goalTemplate" with placeholders.
            2. Extract "triggerKeywords".
            3. Formulate "abstractPlan" (JSON array).
            4. **NEW**: Extract "learnedInsights" - general wisdom or heuristics learned.
            
            Return JSON.`;

            const response = await this.ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            goalTemplate: { type: Type.STRING },
                            triggerKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                            stepsJson: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { step_goal: { type: Type.STRING } } } },
                            learnedInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });
            
            // FIX: Added explicit null check for response.text to prevent build errors.
            if (!response.text) {
                console.error("[ExperienceConsolidation] AI returned empty response.");
                return;
            }

            const data = JSON.parse(response.text.trim());

            // 1. Store the Experience Plan (Postgres)
            await sql`
                INSERT INTO experiences ("sourceRunId", "goalTemplate", "triggerKeywords", "stepsJson")
                VALUES (${runId}, ${data.goalTemplate}, ${data.triggerKeywords as any}, ${JSON.stringify(data.stepsJson)});
            `;

            // 2. Store Insights in Semantic Memory (Pinecone)
            if (data.learnedInsights?.length > 0) {
                for (const insight of data.learnedInsights) {
                    await this.semanticMemory.store({
                        text: `[Insight from goal: ${goal}]: ${insight}`,
                        metadata: { type: 'learned_insight', sourceRunId: runId }
                    });
                }
            }

        } catch (error) {
            console.error('[ExperienceConsolidation] Failed:', error);
        }
    }
}
