
"use client";

// FIX: Added React import to resolve namespace errors.
import React, { useState, useCallback } from 'react';
import type { Prompt, ActiveWorkflowState, Conversation, IStatus, Message, Contact, Tool } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

interface UseWorkflowManagerProps {
    currentConversation: Conversation | null;
    setStatus: (status: Partial<IStatus>) => void;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], history?: Message[]) => Promise<{aiResponse: string | null, suggestion: string | null}>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * A custom hook to manage the state and execution of multi-step prompt chains (workflows).
 */
export const useWorkflowManager = ({ currentConversation, setStatus, addMessage, setMessages }: UseWorkflowManagerProps) => {
    const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflowState | null>(null);
    const { log } = useLog();

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
        const stepDisplayNumber = currentStep.step || currentStepIndex + 1;
        setStatus({ currentAction: `Executing workflow: Step ${stepDisplayNumber} of ${prompt.chain_definition.length}` });

        let stepResult: string | null = null;

        try {
            if (currentStep.type === 'tool' && currentStep.toolId) {
                // --- Tool Execution Logic ---
                log('Executing tool step in workflow', { step: currentStep });

                // 1. Add informational message that the tool is running
                const toolExecutionMessage: Message = { id: crypto.randomUUID(), conversationId: currentConversation!.id, role: 'model', content: `*Executing tool for step ${stepDisplayNumber}...*`, createdAt: new Date() };
                setMessages(prev => [...prev, toolExecutionMessage]);

                // 2. Resolve arguments
                const args: Record<string, any> = {};
                for (const [argName, mapping] of Object.entries(currentStep.inputMapping)) {
                    if (mapping.source === 'userInput') {
                        args[argName] = userInputs[argName];
                    } else if (mapping.source === 'stepOutput' && mapping.step) {
                        args[argName] = stepOutputs[mapping.step];
                    }
                }

                // 3. Call the backend to execute the tool
                const res = await fetch('/api/agents/execute-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toolId: currentStep.toolId, args }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Tool execution failed for step ${stepDisplayNumber}`);
                }
                const { result } = await res.json();
                stepResult = result;

                // 4. Add observation message to UI
                const toolObservationMessage: Message = { id: crypto.randomUUID(), conversationId: currentConversation!.id, role: 'model', content: `**Observation (Step ${stepDisplayNumber}):**\n\n${stepResult}`, createdAt: new Date() };
                setMessages(prev => [...prev, toolObservationMessage]);

            } else if (currentStep.type === 'prompt' && currentStep.promptId) {
                // --- Prompt Execution Logic (existing) ---
                log('Executing prompt step in workflow', { step: currentStep });
                const promptRes = await fetch(`/api/prompts/${currentStep.promptId}`);
                if (!promptRes.ok) throw new Error(`Could not fetch prompt for step ${stepDisplayNumber}`);
                const stepPrompt: Prompt = await promptRes.json();
                
                let interpolatedContent = stepPrompt.content;
                for (const [variableName, mapping] of Object.entries(currentStep.inputMapping)) {
                    let value = mapping.source === 'userInput' ? userInputs[variableName] : stepOutputs[mapping.step!];
                    if (value === undefined) throw new Error(`Missing value for variable '${variableName}' in step ${stepDisplayNumber}`);
                    interpolatedContent = interpolatedContent.replace(new RegExp(`{{\\s*${variableName}\\s*}}`, 'g'), value);
                }
                
                const { aiResponse } = await addMessage({ role: 'user', content: interpolatedContent });
                if (!aiResponse) throw new Error(`AI response was empty for step ${stepDisplayNumber}.`);
                stepResult = aiResponse;
            } else {
                throw new Error(`Invalid step configuration at step ${stepDisplayNumber}`);
            }

            // FIX: Ensure stepResult is not null before assigning to a string-only record.
            if (stepResult === null) {
                throw new Error(`Step ${stepDisplayNumber} did not produce a valid string result.`);
            }

            // Prepare for the next step
            const nextState: ActiveWorkflowState = { 
                ...workflowState, 
                currentStepIndex: currentStepIndex + 1, 
                stepOutputs: { ...stepOutputs, [stepDisplayNumber]: stepResult } 
            };
            setActiveWorkflow(nextState);

            // Recursively call for the next step
            executeNextWorkflowStep(nextState);

        } catch (error) {
            const errorMessage = `Workflow failed at step ${stepDisplayNumber}: ${(error as Error).message}`;
            setStatus({ error: errorMessage });
            log('Workflow execution failed', { error: errorMessage }, 'error');
            setActiveWorkflow(null);
        }
    }, [addMessage, setStatus, currentConversation, log, setMessages]);


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
