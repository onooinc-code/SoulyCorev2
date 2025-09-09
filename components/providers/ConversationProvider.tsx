
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import type { Conversation, Message, Contact, Prompt, Role } from '@/lib/types';
import { useLog } from './LogProvider';
import { IStatus } from '@/lib/types';

interface ActiveWorkflowState {
  prompt: Prompt;
  userInputs: Record<string, string>;
  currentStepIndex: number;
  stepOutputs: Record<number, string>;
}

interface ConversationContextType {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setCurrentConversation: (conversationId: string | null) => void;
    updateCurrentConversation: (updatedData: Partial<Conversation>) => void;
    createNewConversation: () => Promise<void>;
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], history?: Message[]) => Promise<{aiResponse: string | null, suggestion: string | null}>;
    toggleBookmark: (messageId: string) => Promise<void>;
    loadConversations: () => Promise<void>;
    isLoading: boolean;
    status: IStatus;
    setStatus: (status: Partial<IStatus>) => void;
    clearError: () => void;
    deleteConversation: (conversationId: string) => Promise<void>;
    updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>;
    generateConversationTitle: (conversationId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    updateMessage: (messageId: string, newContent: string) => Promise<void>;
    regenerateAiResponse: (messageId: string) => Promise<void>;
    regenerateUserPromptAndGetResponse: (messageId: string) => Promise<void>;
    unreadConversations: Set<string>;
    clearMessages: (conversationId: string) => Promise<void>;
    backgroundTaskCount: number;
    startBackgroundTask: () => void;
    endBackgroundTask: () => void;
    startWorkflow: (prompt: Prompt, userInputs: Record<string, string>) => void;
    activeWorkflow: ActiveWorkflowState | null;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({ currentAction: '', error: null });
    const { log } = useLog();
    
    const [unreadConversations, setUnreadConversations] = useState(new Set<string>());
    const isVisibleRef = useRef(true);
    const [backgroundTaskCount, setBackgroundTaskCount] = useState(0);
    const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflowState | null>(null);

    const startBackgroundTask = useCallback(() => setBackgroundTaskCount(prev => prev + 1), []);
    const endBackgroundTask = useCallback(() => setBackgroundTaskCount(prev => (prev > 0 ? prev - 1 : 0)), []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = document.visibilityState === 'visible';
            if (isVisibleRef.current && currentConversation) {
                setUnreadConversations(prev => {
                    const newSet = new Set(prev);
                    if (newSet.delete(currentConversation.id)) return newSet;
                    return prev;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [currentConversation]);

    const setStatus = useCallback((newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    }, []);

    const clearError = useCallback(() => setStatus({ error: null }), [setStatus]);

    const loadConversations = useCallback(async () => {
        log('Fetching conversation list...');
        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) throw new Error('Failed to fetch conversations');
            const convos = await response.json();
            setConversations(convos);
            log(`Successfully fetched ${convos.length} conversations.`);
        } catch (error) {
            const errorMessage = 'Could not load conversations.';
            setStatus({ error: errorMessage });
            log(errorMessage, { error: { message: (error as Error).message } }, 'error');
        }
    }, [setStatus, log]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

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

    const setCurrentConversationById = useCallback(async (conversationId: string | null) => {
        if (conversationId) {
            setUnreadConversations(prev => {
                const newSet = new Set(prev);
                if (newSet.delete(conversationId)) return newSet;
                return prev;
            });
        }
        
        if (!conversationId) {
            setCurrentConversation(null);
            setMessages([]);
            return;
        }

        const convo = conversations.find(c => c.id === conversationId);
        if (convo) {
            setCurrentConversation(convo);
            fetchMessages(conversationId);
        }
    }, [conversations, fetchMessages]);

    const updateCurrentConversation = useCallback((updatedData: Partial<Conversation>) => {
        if (currentConversation) {
            const newConversation = { ...currentConversation, ...updatedData };
            setCurrentConversation(newConversation);
            setConversations(convos => convos.map(c => c.id === newConversation.id ? newConversation : c));
        }
    }, [currentConversation]);
    
    const createNewConversation = useCallback(async () => {
        setIsLoading(true);
        setStatus({ currentAction: "Creating new chat..." });
        try {
            const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to create conversation');
            const newConversation: Conversation = await res.json();
            await loadConversations();
            setCurrentConversationById(newConversation.id);
        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [setStatus, loadConversations, setCurrentConversationById]);

    const addMessage = useCallback(async (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], historyOverride?: Message[]) => {
        if (!currentConversation) {
            setStatus({ error: "Cannot send a message. No active conversation selected." });
            return { aiResponse: null, suggestion: null };
        }

        setIsLoading(true);
        setStatus({ currentAction: "Processing...", error: null });

        const optimisticUserMessage: Message = { ...message, id: crypto.randomUUID(), createdAt: new Date(), conversationId: currentConversation.id };
        if (!historyOverride) {
            setMessages(prev => [...prev, optimisticUserMessage]);
        }

        try {
            let messageHistory = historyOverride ? [...historyOverride] : [...messages, optimisticUserMessage];
            
            const userMsgRes = await fetch(`/api/conversations/${currentConversation.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: optimisticUserMessage }) });
            if (!userMsgRes.ok) throw new Error("Failed to save your message.");
            const savedUserMessage: Message = await userMsgRes.json();
            
            setMessages(prev => prev.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m));
            messageHistory = messageHistory.map(m => m.id === optimisticUserMessage.id ? savedUserMessage : m);

            const chatRes = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messageHistory, conversation: currentConversation, mentionedContacts, userMessageId: savedUserMessage.id }) });
            if (!chatRes.ok) throw new Error((await chatRes.json()).error || 'Failed to get AI response');
            const { response: aiResponse, suggestion } = await chatRes.json();
            
            if (aiResponse) {
                const updatedMessages = await fetchMessages(currentConversation.id);
                const aiMessage = updatedMessages[updatedMessages.length - 1];
                if (!isVisibleRef.current) setUnreadConversations(prev => new Set(prev).add(currentConversation.id));

                if (currentConversation.enableMemoryExtraction) {
                    startBackgroundTask();
                    fetch('/api/memory/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ textToAnalyze: `${message.content}\n${aiResponse}`, aiMessageId: aiMessage?.id }) })
                        .catch(err => console.error("Memory pipeline trigger failed.", err))
                        .finally(endBackgroundTask);
                }
            }
            return { aiResponse, suggestion };
        } catch (error) {
            setStatus({ error: (error as Error).message, currentAction: "Error" });
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
            return { aiResponse: null, suggestion: null };
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [currentConversation, messages, setStatus, startBackgroundTask, endBackgroundTask, fetchMessages]);

    const executeNextWorkflowStep = useCallback(async (workflowState: ActiveWorkflowState) => {
        const { prompt, userInputs, currentStepIndex, stepOutputs } = workflowState;
        if (!prompt.chain_definition || currentStepIndex >= prompt.chain_definition.length) {
            setActiveWorkflow(null); return;
        }
        const currentStep = prompt.chain_definition[currentStepIndex];
        try {
            const promptRes = await fetch(`/api/prompts/${currentStep.promptId}`);
            if (!promptRes.ok) throw new Error(`Could not fetch prompt for step ${currentStep.step}`);
            const stepPrompt: Prompt = await promptRes.json();
            let interpolatedContent = stepPrompt.content;
            for (const [variableName, mapping] of Object.entries(currentStep.inputMapping)) {
                let value = mapping.source === 'userInput' ? userInputs[variableName] : stepOutputs[mapping.step!];
                if (value === undefined) throw new Error(`Missing value for variable ${variableName}`);
                interpolatedContent = interpolatedContent.replace(new RegExp(`{{\\s*${variableName}\\s*}}`, 'g'), value);
            }
            const { aiResponse } = await addMessage({ role: 'user', content: interpolatedContent });
            if (!aiResponse) throw new Error(`AI response was empty for step ${currentStep.step}.`);
            const nextState: ActiveWorkflowState = { ...workflowState, currentStepIndex: currentStepIndex + 1, stepOutputs: { ...stepOutputs, [currentStep.step]: aiResponse } };
            setActiveWorkflow(nextState);
            executeNextWorkflowStep(nextState);
        } catch (error) {
            setStatus({ error: `Workflow failed: ${(error as Error).message}` });
            setActiveWorkflow(null);
        }
    }, [addMessage, setStatus]);

    const startWorkflow = useCallback((prompt: Prompt, userInputs: Record<string, string>) => {
        if (!currentConversation) { setStatus({ error: "Cannot start a workflow without an active conversation." }); return; }
        const initialState: ActiveWorkflowState = { prompt, userInputs, currentStepIndex: 0, stepOutputs: {} };
        setActiveWorkflow(initialState);
        executeNextWorkflowStep(initialState);
    }, [currentConversation, setStatus, executeNextWorkflowStep]);

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

    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete conversation.');
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
            }
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    }, [currentConversation, setStatus]);

    const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c));
        if (currentConversation?.id === conversationId) {
            setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
        }
        try {
            await fetch(`/api/conversations/${conversationId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
        } catch (error) {
            log('Failed to save updated title to DB.', { error }, 'error');
            loadConversations();
        }
    }, [currentConversation, log, loadConversations]);

    const generateConversationTitle = useCallback(async (conversationId: string) => {
        setStatus({ currentAction: 'Generating title...' });
        try {
            const res = await fetch(`/api/conversations/${conversationId}/generate-title`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate title.');
            const updatedConversation = await res.json();
            setConversations(prev => prev.map(c => c.id === conversationId ? updatedConversation : c));
            if (currentConversation?.id === conversationId) setCurrentConversation(updatedConversation);
        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setStatus({ currentAction: '' });
        }
    }, [currentConversation, setStatus]);

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
        if (!currentConversation) return;
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex < 1 || messages[messageIndex].role !== 'model') return;
        const historyToResend = messages.slice(0, messageIndex);
        await deleteMessage(messageId);
        await addMessage(historyToResend[historyToResend.length - 1], [], historyToResend.slice(0, -1));
    }, [messages, currentConversation, addMessage, deleteMessage]);

    const regenerateUserPromptAndGetResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || messages[messageIndex].role !== 'user') return;
        const userMessage = messages[messageIndex];
        let aiMessageToDelete = (messageIndex + 1 < messages.length && messages[messageIndex + 1].role === 'model') ? messages[messageIndex + 1] : null;
        const historyForContext = messages.slice(0, messageIndex);
        try {
            const regenRes = await fetch('/api/prompt/regenerate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promptToRewrite: userMessage.content, history: historyForContext.map(m => ({ role: m.role, parts: [{ text: m.content }] })) }) });
            if (!regenRes.ok) throw new Error('Failed to get rewritten prompt.');
            const { rewrittenPrompt } = await regenRes.json();
            await deleteMessage(userMessage.id);
            if(aiMessageToDelete) await deleteMessage(aiMessageToDelete.id);
            await addMessage({ role: 'user', content: rewrittenPrompt }, [], historyForContext);
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

    const contextValue = {
        conversations, currentConversation, messages,
        setCurrentConversation: setCurrentConversationById,
        updateCurrentConversation, createNewConversation, addMessage, toggleBookmark, loadConversations,
        isLoading, status, setStatus, clearError,
        deleteConversation, updateConversationTitle, generateConversationTitle, deleteMessage, updateMessage,
        regenerateAiResponse, regenerateUserPromptAndGetResponse, unreadConversations, clearMessages,
        backgroundTaskCount, startBackgroundTask, endBackgroundTask, startWorkflow, activeWorkflow,
    };

    return <ConversationContext.Provider value={contextValue}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) throw new Error('useConversation must be used within a ConversationProvider');
    return context;
};
