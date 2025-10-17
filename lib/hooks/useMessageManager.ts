"use client";

import { useState, useCallback } from 'react';
import type { Message, Conversation, Contact, IStatus } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

interface UseMessageManagerProps {
    currentConversation: Conversation | null;
    setStatus: (status: Partial<IStatus>) => void;
    setIsLoading: (loading: boolean) => void;
    startBackgroundTask: () => void;
    endBackgroundTask: () => void;
    onNewMessageWhileHidden: (conversationId: string) => void;
}

export const useMessageManager = ({
    currentConversation,
    setStatus,
    setIsLoading,
    startBackgroundTask,
    endBackgroundTask,
    onNewMessageWhileHidden,
}: UseMessageManagerProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const { log } = useLog();

    const fetchMessages = useCallback(async (conversationId: string) => {
        setIsLoading(true);
        setStatus({ currentAction: "Loading messages..." });
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            setStatus({ error: 'Could not load messages.' });
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [setIsLoading, setStatus]);
    
    const addMessage = useCallback(async (
        message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>,
        mentionedContacts: Contact[] = [],
        historyOverride?: Message[],
        parentMessageId?: string,
    ): Promise<{ aiResponse: string | null; suggestion: string | null }> => {
        if (!currentConversation) {
            setStatus({ error: 'No active conversation to add a message to.' });
            return { aiResponse: null, suggestion: null };
        }

        const userMessageId = `temp-user-${Date.now()}`;
        const userMessage: Message = {
            id: userMessageId,
            conversationId: currentConversation.id,
            createdAt: new Date(),
            ...message,
            parentMessageId,
        };

        const currentHistory = historyOverride || messages;
        const updatedHistory = [...currentHistory, userMessage];
        setMessages(updatedHistory);
        setIsLoading(true);
        setStatus({ currentAction: {
            currentPhase: "Assembling Context",
            phases: [
                { name: "Context", status: "running" },
                { name: "Generation", status: "pending" },
                { name: "Memory", status: "pending" },
            ]
        } });

        try {
            // First, save the user's message to get a real ID
            const savedUserMessageRes = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            if (!savedUserMessageRes.ok) throw new Error("Failed to save user message.");
            const savedUserMessage = await savedUserMessageRes.json();
            
            // Update the UI with the real message from the DB
            setMessages(prev => prev.map(m => m.id === userMessageId ? savedUserMessage : m));
            
            // Then, get the AI response
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
                    conversation: currentConversation,
                    mentionedContacts,
                    userMessageId: savedUserMessage.id, // Pass real ID for logging
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'The AI failed to respond.');
            }
            const { response, suggestion } = await res.json();
            
            // Trigger memory pipeline (fire and forget)
            if (currentConversation.enableMemoryExtraction) {
                startBackgroundTask();
                fetch('/api/memory/pipeline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        textToAnalyze: `${message.content}\n\n${response}`,
                        aiMessageId: 'temp-ai-id', // This would need to be updated with real AI message ID
                        conversationId: currentConversation.id,
                    }),
                }).finally(() => {
                    endBackgroundTask();
                });
            }

            return { aiResponse: response, suggestion: suggestion || null };

        } catch (error) {
            setStatus({ error: (error as Error).message });
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [currentConversation, messages, setStatus, setIsLoading, startBackgroundTask, endBackgroundTask]);

    const toggleBookmark = useCallback(async (messageId: string) => {
        try {
            const res = await fetch(`/api/messages/${messageId}/bookmark`, { method: 'PUT' });
            if (!res.ok) throw new Error('Failed to toggle bookmark.');
            const updatedMessage: Message = await res.json();
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    }, [setStatus]);

    const deleteMessage = useCallback(async (messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        try {
            await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
        } catch (error) {
            log('Failed to delete message from DB.', { error }, 'error');
            // Optionally refetch messages to revert UI on failure
        }
    }, [log]);
    
    const updateMessage = useCallback(async (messageId: string, newContent: string) => {
        setMessages(prev => prev.map(m => m.id === messageId ? {...m, content: newContent} : m));
        try {
            await fetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent }),
            });
        } catch (error) {
            log('Failed to save updated message to DB.', { error }, 'error');
        }
    }, [log]);
    
     const regenerateAiResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || messages[messageIndex].role !== 'model') return;

        const historyUpToMessage = messages.slice(0, messageIndex);
        const userMessageForContext = historyUpToMessage.findLast(m => m.role === 'user');
        if (!userMessageForContext) return;

        const { aiResponse } = await addMessage(
            {role: userMessageForContext.role, content: userMessageForContext.content}, 
            [], 
            historyUpToMessage
        );
        // This is a simplified regeneration. A full implementation might replace the old response.
    }, [messages, addMessage]);
    
    const regenerateUserPromptAndGetResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || messages[messageIndex].role !== 'user') return;

        const historyUpToMessage = messages.slice(0, messageIndex);
        const promptToRewrite = messages[messageIndex].content;
        
        setIsLoading(true);
        try {
            const res = await fetch('/api/prompt/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptToRewrite, history: historyUpToMessage }),
            });
            if (!res.ok) throw new Error('Failed to regenerate prompt.');
            const { rewrittenPrompt } = await res.json();
            
            // Send the rewritten prompt to get a new response
            await addMessage({ role: 'user', content: rewrittenPrompt }, [], historyUpToMessage);

        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [messages, setIsLoading, setStatus, addMessage]);

    const clearMessages = useCallback(async (conversationId: string) => {
        setMessages([]);
        try {
            await fetch(`/api/conversations/${conversationId}/clear-messages`, { method: 'POST' });
        } catch (error) {
            log('Failed to clear messages on server', { error }, 'error');
            fetchMessages(conversationId);
        }
    }, [log, fetchMessages]);

    return {
        messages,
        setMessages,
        fetchMessages,
        addMessage,
        toggleBookmark,
        deleteMessage,
        updateMessage,
        regenerateAiResponse,
        regenerateUserPromptAndGetResponse,
        clearMessages,
    };
};
