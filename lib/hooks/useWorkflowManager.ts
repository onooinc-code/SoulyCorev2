"use client";

// FIX: Added React import to resolve namespace errors.
import React, { useState, useCallback } from 'react';
// FIX: Added imports for ActiveWorkflowState and IStatus types.
import type { Conversation, Prompt, Message, ActiveWorkflowState, IStatus } from '@/lib/types';
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
        
        setActiveWorkflow(workflowState);
        executeWorkflow(workflowState);

    }, [log]);

    const executeWorkflow = async (workflowState: ActiveWorkflowState) => {
        if (!currentConversation) {
            setStatus({ error: "No active conversation to run workflow in." });
            setActiveWorkflow(null);
            return;
        }

        try {
            const res = await fetch('/api/prompts/execute-chain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptId: workflowState.prompt.id,
                    userInputs: workflowState.userInputs,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Workflow execution failed on the server.');
            }

            const finalResponse = data.finalResponse;
            
            // Log user inputs as first message
            const userInputMessageContent = `Executing workflow "${workflowState.prompt.name}" with inputs:\n${JSON.stringify(workflowState.userInputs, null, 2)}`;
            const optimisticUserMessage: Message = { role: 'user', content: userInputMessageContent, id: crypto.randomUUID(), createdAt: new Date(), conversationId: currentConversation.id, lastUpdatedAt: new Date() };
            setMessages(prev => [...prev, optimisticUserMessage]);
            
            // Log final response as AI message
            const aiResponseMessage: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
                role: 'model',
                content: finalResponse,
                lastUpdatedAt: new Date(),
            };
            
            // Use the addMessage function to properly store the AI response
            await addMessage(aiResponseMessage, [], [optimisticUserMessage]);


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