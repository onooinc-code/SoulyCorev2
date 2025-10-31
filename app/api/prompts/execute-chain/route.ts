

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateChatResponse } from '@/lib/gemini-server';
// FIX: Corrected import paths for types.
import { Prompt, PromptChainStep } from '@/lib/types';
import { Content } from '@google/genai';

export async function POST(req: NextRequest) {
    try {
        const { promptId, userInputs } = await req.json();

        if (!promptId || !userInputs) {
            return NextResponse.json({ error: 'Missing promptId or userInputs' }, { status: 400 });
        }

        // 1. Fetch the main chain prompt definition from the database.
        const { rows: chainPromptRows } = await sql<Prompt>`
            SELECT * FROM prompts WHERE id = ${promptId} AND type = 'chain';
        `;

        if (chainPromptRows.length === 0) {
            return NextResponse.json({ error: 'Chained prompt not found' }, { status: 404 });
        }

        const chainPrompt = chainPromptRows[0];
        const chainDefinition = chainPrompt.chainDefinition;

        if (!chainDefinition || chainDefinition.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty chain definition' }, { status: 400 });
        }
        
        // Sort steps to ensure correct execution order
        chainDefinition.sort((a, b) => a.step - b.step);

        const stepOutputs: Record<number, string> = {};
        let lastResponse: string | null = null;

        // 2. Execute each step in the chain.
        for (const step of chainDefinition) {
            // 2a. Fetch the single prompt for the current step.
            const { rows: singlePromptRows } = await sql<Prompt>`
                SELECT content FROM prompts WHERE id = ${step.promptId} AND type = 'single';
            `;

            if (singlePromptRows.length === 0) {
                throw new Error(`Prompt for step ${step.step} (ID: ${step.promptId}) not found.`);
            }
            
            let currentPromptContent = singlePromptRows[0].content;

            // 2b. Replace variables with values from user input or previous steps.
            // FIX: Explicitly cast the 'mapping' object to its expected type to resolve 'unknown' type errors.
            for (const [variableName, mappingUntyped] of Object.entries(step.inputMapping)) {
                const mapping = mappingUntyped as { source: 'userInput' | 'stepOutput'; step?: number };
                let value: string;
                if (mapping.source === 'userInput') {
                    if (!(variableName in userInputs)) {
                        throw new Error(`Missing user input for variable "${variableName}" in step ${step.step}.`);
                    }
                    value = userInputs[variableName];
                } else { // source === 'stepOutput'
                    if (!mapping.step || !(mapping.step in stepOutputs)) {
                        throw new Error(`Missing output from step ${mapping.step} required for variable "${variableName}" in step ${step.step}.`);
                    }
                    value = stepOutputs[mapping.step];
                }
                
                // Replace placeholder
                const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
                currentPromptContent = currentPromptContent.replace(regex, value);
            }
            
            // 2c. Call the AI model.
            const history: Content[] = [{ role: 'user', parts: [{ text: currentPromptContent }] }];
            const result = await generateChatResponse(history, ""); // Using empty system instruction

            if (!result || !result.text) {
                throw new Error(`AI failed to generate a response for step ${step.step}.`);
            }
            
            const responseText = result.text.trim();

            // 2d. Store the output for subsequent steps.
            stepOutputs[step.step] = responseText;
            lastResponse = responseText;
        }

        // 3. Return the final response from the last step.
        return NextResponse.json({ finalResponse: lastResponse });

    } catch (error) {
        console.error('Error executing prompt chain:', error);
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}