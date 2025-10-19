"use client";

import React, { useState, useCallback } from 'react';
import type { Conversation, Prompt, Message, ActiveWorkflowState, IStatus, PromptChainStep } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

interface UseWorkflowManagerProps {
    currentConversation: Conversation | null;
    setStatus: (status: Partial<IStatus>) => void;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: any[], historyOverride?: Message[], parentMessageId?: string | null) => Promise<{ aiResponse: string | null; suggestion: string | null }>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const useWorkflowManager = ({ currentConversation, setStatus, addMessage, setMessages }: UseWorkflowManagerProps) => {
    const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflowState | null>(null);
    const { log } = useLog();

    const startWorkflow = useCallback((prompt: Prompt, userInputs: Record<string, string>) => {
        if (prompt.type !== 'chain' || !prompt.chain_definition) {
            log('Attempted to start a workflow with a non-chain prompt.', { promptId: prompt.id }, 'warn');
            return;
        }
        
        log('Starting workflow', { promptName: prompt.name, userInputs });
        
        const workflowState: ActiveWorkflowState = {
            prompt,
            userInputs,
            currentStepIndex: 0,
            stepOutputs: {},
        };
        
        // Log user inputs as the first message
        const userInputMessageContent = `Executing workflow "${prompt.name}" with inputs:\n\`\`\`json\n${JSON.stringify(userInputs, null, 2)}\n\`\`\``;
        const optimisticUserMessage: Message = { role: 'user', content: userInputMessageContent, id: crypto.randomUUID(), createdAt: new Date(), conversationId: currentConversation!.id, lastUpdatedAt: new Date() };
        setMessages(prev => [...prev, optimisticUserMessage]);

        setActiveWorkflow(workflowState);
        executeWorkflow(workflowState, [optimisticUserMessage]);

    }, [log, currentConversation, setMessages]);


    const executeWorkflow = async (workflowState: ActiveWorkflowState, history: Message[]) => {
        if (!currentConversation) {
            setStatus({ error: "No active conversation to run workflow in." });
            setActiveWorkflow(null);
            return;
        }

        let currentHistory = [...history];
        let currentStepIndex = 0;
        const stepOutputs: Record<number, string> = {};
        const chain = workflowState.prompt.chain_definition!.sort((a, b) => a.step - b.step);

        try {
            for (const step of chain) {
                setActiveWorkflow(prev => prev ? { ...prev, currentStepIndex } : null);

                const stepType = step.type || 'prompt';
                let observation = '';

                if (stepType === 'prompt') {
                    // Execute a prompt step
                    const { aiResponse } = await addMessage(
                        { role: 'user', content: `[Workflow Step ${step.step}] Running prompt...`, lastUpdatedAt: new Date() },
                        [],
                        currentHistory
                    );
                    if (!aiResponse) throw new Error(`Step ${step.step} (Prompt) failed to produce an output.`);
                    observation = aiResponse;
                } else if (stepType === 'tool') {
                    // Execute a tool step
                    const toolRes = await fetch('/api/agents/execute-tool', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toolName: step.toolId, args: step.inputMapping }) // Simplified for now
                    });
                    const toolData = await toolRes.json();
                    if (!toolRes.ok) throw new Error(toolData.error || `Step ${step.step} (Tool) failed.`);
                    observation = toolData.observation;
                }
                
                stepOutputs[step.step] = observation;
                
                // Add observation to history for next step
                const observationMessage: Message = {
                    role: 'model',
                    content: `[Observation for Step ${step.step}]:\n${observation}`,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    conversationId: currentConversation.id,
                    lastUpdatedAt: new Date(),
                };
                currentHistory.push(observationMessage);
                setMessages(prev => [...prev, observationMessage]);

                currentStepIndex++;
            }
            
            // Final result message
            const finalResult = stepOutputs[chain.length];
            const finalMessage: Omit<Message, 'id'|'createdAt'|'conversationId'> = {
                role: 'model',
                content: `Workflow "${workflowState.prompt.name}" completed successfully.\n\n**Final Output:**\n${finalResult}`,
                lastUpdatedAt: new Date(),
            };
            await addMessage(finalMessage, [], currentHistory);

        } catch (error) {
            const errorMessage = `Workflow "${workflowState.prompt.name}" failed: ${(error as Error).message}`;
            setStatus({ error: errorMessage });
            log('Workflow execution failed', { error: (error as Error).message }, 'error');
        } finally {
            setActiveWorkflow(null);
        }
    };
    
    return {
        activeWorkflow,
        startWorkflow,
    };
};