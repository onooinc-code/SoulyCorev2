

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
// FIX: Added imports for IStatus and CognitivePhase types.
import type { Message, Conversation, Contact, IStatus, CognitivePhase } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

interface UseMessageManagerProps {
    currentConversation: Conversation | null;
    setStatus: (status: Partial<IStatus>) => void;
    setIsLoading: (loading: boolean) => void;
    startBackgroundTask: () => void;
    endBackgroundTask: () => void;
    onNewMessageWhileHidden: (conversationId: string) => void;
}

/**
 * A custom hook that manages the state and API interactions for messages within a single conversation.
 */
export const useMessageManager = ({ currentConversation, setStatus, setIsLoading, startBackgroundTask, endBackgroundTask, onNewMessageWhileHidden }: UseMessageManagerProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const { log } = useLog();
    const isVisibleRef = useRef(true);
    const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Track browser tab visibility to manage unread notifications
    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = document.visibilityState === 'visible';
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const fetchMessages = useCallback(async (conversationId: string) => {
        log(`Fetching messages for conversation: ${conversationId}`);
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            const msgs = await response.json();
            setMessages(msgs);
            log(`Successfully fetched ${msgs.length} messages.`);
            return msgs;
        } catch (error) {
             const errorMessage = 'Could not load messages for this chat.';
             setStatus({ error: errorMessage });
             log(errorMessage, { error: { message: (error as Error).message } }, 'error');
             return [];
        }
    }, [setStatus, log]);

    const addMessage = useCallback(async (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], historyOverride?: Message[], parentMessageId?: string | null) => {
        if (!currentConversation) {
            setStatus({ error: "Cannot send a message. No active conversation selected." });
            return { aiResponse: null, suggestion: null };
        }

        setIsLoading(true);
        setStatus({ error: null });

        // Start phase simulation
        phaseTimers.current.forEach(clearTimeout);
        phaseTimers.current = [];
        setStatus({ currentAction: { phase: 'retrieving', details: 'Querying semantic & structured memory...' }});
        phaseTimers.current.push(setTimeout(() => setStatus({ currentAction: { phase: 'assembling', details: 'Assembling context from retrieved data...' }}), 700));
        phaseTimers.current.push(setTimeout(() => setStatus({ currentAction: { phase: 'prompting', details: 'Sending final prompt to the model...' }}), 1500));
        phaseTimers.current.push(setTimeout(() => setStatus({ currentAction: { phase: 'generating', details: 'Generating response from the model...' }}), 2200));


        const optimisticUserMessage: Message = { ...message, id: crypto.randomUUID(), createdAt: new Date(), conversationId: currentConversation.id, parentMessageId: parentMessageId, lastUpdatedAt: new Date() };
        
        // Don't show optimistic user message if it's part of a workflow history override
        if (!historyOverride) {
            setMessages(prev => [...prev, optimisticUserMessage]);
        }

        try {
            const messageHistory = historyOverride ? [...historyOverride, optimisticUserMessage] : [...messages, optimisticUserMessage];
            
            const userMsgRes = await fetch(`/api/conversations/${currentConversation.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: optimisticUserMessage }) });
            if (!userMsgRes.ok) {
                const errorData = await userMsgRes.json().catch(() => ({ error: "Failed to save your message and could not parse error response." }));
                throw new Error(errorData.details?.message || errorData.error || "Failed to save your message.");
            }
            const savedUserMessage: Message = await userMsgRes.json();
            
            // Replace optimistic message with the real one from the DB
            setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m));

            const chatRes = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messageHistory, conversation: currentConversation, mentionedContacts, userMessageId: savedUserMessage.id }) });
            if (!chatRes.ok) {
                const errorData = await chatRes.json().catch(() => ({ error: "Failed to get AI response and could not parse error response." }));
                throw new Error(errorData.details?.message || errorData.error || 'Failed to get AI response');
            }
            const { response: aiResponse, suggestion } = await chatRes.json();
            
            if (aiResponse) {
                // The AI message is saved to the DB on the backend, so we just need to re-fetch the list.
                const updatedMessages = await fetchMessages(currentConversation.id);
                if (!isVisibleRef.current) {
                    onNewMessageWhileHidden(currentConversation.id);
                }

                if (currentConversation.enableMemoryExtraction) {
                    startBackgroundTask();
                    const aiMessage = updatedMessages[updatedMessages.length - 1];
                    fetch('/api/memory/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ textToAnalyze: `${message.content}\n${aiResponse}`, aiMessageId: aiMessage?.id, conversationId: currentConversation.id }) })
                        .catch(err => console.error("Memory pipeline trigger failed.", err))
                        .finally(endBackgroundTask);
                }
            }
            return { aiResponse, suggestion };
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage, currentAction: "Error" });
            log('Failed to add message.', { error: errorMessage, stack: (error as Error).stack }, 'error');
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id)); // Revert optimistic update
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
            phaseTimers.current.forEach(clearTimeout);
            phaseTimers.current = [];
        }
    }, [currentConversation, messages, setStatus, setIsLoading, startBackgroundTask, endBackgroundTask, fetchMessages, onNewMessageWhileHidden, log]);
    
    const toggleBookmark = useCallback(async (messageId: string) => {
        try {
            const res = await fetch(`/api/messages/${messageId}/bookmark`, { method: 'PUT' });
            if (!res.ok) throw new Error('Failed to toggle bookmark status.');
            const updatedMessage = await res.json();
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    }, [setStatus]);

    const deleteMessage = useCallback(async (messageId: string) => {
        const originalMessages = messages;
        setMessages(prev => prev.filter(m => m.id !== messageId));
        try {
            const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete message from server.');
        } catch (error) {
            setMessages(originalMessages);
            setStatus({ error: (error as Error).message });
        }
    }, [messages, setStatus]);

    const updateMessage = useCallback(async (messageId: string, newContent: string) => {
        const originalMessages = messages;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent } : m));
        try {
            const res = await fetch(`/api/messages/${messageId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newContent }) });
            if (!res.ok) throw new Error('Failed to update message on server.');
            const updatedMessage = await res.json();
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
        } catch (error) {
            setMessages(originalMessages);
            setStatus({ error: (error as Error).message });
        }
    }, [messages, setStatus]);

    const regenerateAiResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex < 1 || messages[messageIndex].role !== 'model') return;
        
        const historyToResend = messages.slice(0, messageIndex);
        await deleteMessage(messageId);
        
        // The last message in the history is the user prompt that led to the AI response.
        const userPrompt = historyToResend[historyToResend.length - 1];
        await addMessage({ role: 'user', content: userPrompt.content, lastUpdatedAt: new Date() }, [], historyToResend.slice(0, -1));
    }, [messages, addMessage, deleteMessage]);

    const regenerateUserPromptAndGetResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || messages[messageIndex].role !== 'user') return;
        
        const userMessage = messages[messageIndex];
        const historyForContext = messages.slice(0, messageIndex);
        
        try {
            const regenRes = await fetch('/api/prompt/regenerate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promptToRewrite: userMessage.content, history: historyForContext.map(m => ({ role: m.role, parts: [{ text: m.content }] })) }) });
            if (!regenRes.ok) throw new Error('Failed to get rewritten prompt.');
            const { rewrittenPrompt } = await regenRes.json();
            
            // Delete the old user message and any subsequent AI message
            await deleteMessage(userMessage.id);
            const nextMessage = messages[messageIndex + 1];
            if (nextMessage && nextMessage.role === 'model') {
                await deleteMessage(nextMessage.id);
            }
            
            // Send the new rewritten prompt
            await addMessage({ role: 'user', content: rewrittenPrompt, lastUpdatedAt: new Date() }, [], historyForContext);
        } catch (error) {
            setStatus({ error: `Failed during prompt regeneration: ${(error as Error).message}` });
        }
    }, [messages, setStatus, addMessage, deleteMessage]);

    const clearMessages = useCallback(async (conversationId: string) => {
        const originalMessages = messages;
        if (currentConversation?.id === conversationId) setMessages([]);
        try {
            const res = await fetch(`/api/conversations/${conversationId}/clear-messages`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to clear messages on server.');
        } catch (error) {
            if (currentConversation?.id === conversationId) setMessages(originalMessages);
            setStatus({ error: (error as Error).message });
        }
    }, [messages, currentConversation, setStatus]);

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