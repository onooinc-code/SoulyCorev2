
"use client";

import { useState, useCallback } from 'react';
import type { Prompt, ActiveWorkflowState, Conversation, IStatus, Message, Contact } from '@/lib/types';

interface UseWorkflowManagerProps {
    currentConversation: Conversation | null;
    setStatus: (status: Partial<IStatus>) => void;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], history?: Message[]) => Promise<{aiResponse: string | null, suggestion: string | null}>;
}

/**
 * A custom hook to manage the state and execution of multi-step prompt chains (workflows).
 */
export const useWorkflowManager = ({ currentConversation, setStatus, addMessage }: UseWorkflowManagerProps) => {
    const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflowState | null>(null);

    /**
     * Executes a single step of the active workflow and recursively calls itself for the next step.
     */
    const executeNextWorkflowStep = useCallback(async (workflowState: ActiveWorkflowState) => {
        const { prompt, userInputs, currentStepIndex, stepOutputs } = workflowState;
        
        if (!prompt.chain_definition || currentStepIndex >= prompt.chain_definition.length) {
            setStatus({ currentAction: "Workflow completed." });
            setActiveWorkflow(null); // Workflow finished
            setTimeout(() => setStatus({ currentAction: "" }), 2000);
            return;
        }

        const currentStep = prompt.chain_definition[currentStepIndex];
        setStatus({ currentAction: `Executing workflow: Step ${currentStep.step} of ${prompt.chain_definition.length}` });

        try {
            // Fetch the prompt content for the current step
            const promptRes = await fetch(`/api/prompts/${currentStep.promptId}`);
            if (!promptRes.ok) throw new Error(`Could not fetch prompt for step ${currentStep.step}`);
            const stepPrompt: Prompt = await promptRes.json();
            
            // Interpolate variables from user input or previous steps
            let interpolatedContent = stepPrompt.content;
            for (const [variableName, mapping] of Object.entries(currentStep.inputMapping)) {
                let value = mapping.source === 'userInput' ? userInputs[variableName] : stepOutputs[mapping.step!];
                if (value === undefined) throw new Error(`Missing value for variable '${variableName}' in step ${currentStep.step}`);
                interpolatedContent = interpolatedContent.replace(new RegExp(`{{\\s*${variableName}\\s*}}`, 'g'), value);
            }
            
            // Execute the step by calling addMessage
            const { aiResponse } = await addMessage({ role: 'user', content: interpolatedContent });
            
            if (!aiResponse) throw new Error(`AI response was empty for step ${currentStep.step}.`);
            
            // Prepare for the next step
            const nextState: ActiveWorkflowState = { 
                ...workflowState, 
                currentStepIndex: currentStepIndex + 1, 
                stepOutputs: { ...stepOutputs, [currentStep.step]: aiResponse } 
            };
            setActiveWorkflow(nextState);

            // Recursively call for the next step
            executeNextWorkflowStep(nextState);

        } catch (error) {
            setStatus({ error: `Workflow failed: ${(error as Error).message}` });
            setActiveWorkflow(null);
        }
    }, [addMessage, setStatus]);

    /**
     * Initializes and starts a new workflow.
     */
    const startWorkflow = useCallback((prompt: Prompt, userInputs: Record<string, string>) => {
        if (!currentConversation) {
            setStatus({ error: "Cannot start a workflow without an active conversation." });
            return;
        }
        if (!prompt.chain_definition || prompt.chain_definition.length === 0) {
            setStatus({ error: "Cannot start a workflow with an empty chain definition." });
            return;
        }

        const initialState: ActiveWorkflowState = { prompt, userInputs, currentStepIndex: 0, stepOutputs: {} };
        setActiveWorkflow(initialState);
        executeNextWorkflowStep(initialState);
    }, [currentConversation, setStatus, executeNextWorkflowStep]);

    return {
        activeWorkflow,
        startWorkflow,
    };
};
