"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Conversation, Message, Contact, IStatus, ActiveWorkflowState, Prompt, ConversationContextType, ILinkPredictionProposal, ToolState, MemoryMonitorState, ExecutionStatus } from '@/lib/types';
import { useAppStatus } from '@/lib/hooks/useAppStatus';
import { useConversationList } from '@/lib/hooks/useConversationList';
import { useMessageManager } from '@/lib/hooks/useMessageManager';
import { useWorkflowManager } from '@/lib/hooks/useWorkflowManager';
import { useLog } from './LogProvider';
import { useUIState } from './UIStateProvider';

interface ExtendedConversationContextType extends Omit<ConversationContextType, 'startAgentRun' | 'startWorkflow' | 'activeRunId'> {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    status: IStatus;
    toolState: ToolState;
    memoryMonitor: MemoryMonitorState;
    backgroundTaskCount: number;
    activeWorkflow: ActiveWorkflowState | null;
    unreadConversations: Set<string>;
    scrollToMessageId: string | null;
    activeSegmentId: string | null;
    activeRunId: string | null;

    setCurrentConversation: (id: string | null) => void;
    createNewConversation: () => void;
    deleteConversation: (id: string) => void;
    updateConversationTitle: (id: string, newTitle: string) => void;
    generateConversationTitle: (id: string) => void;
    loadConversations: (segmentId?: string | null) => Promise<void>;
    updateCurrentConversation: (updates: Partial<Conversation>) => void;
    
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], historyOverride?: Message[], parentMessageId?: string | null) => Promise<{ aiResponse: string | null; suggestion: string | null; memoryProposal: any | null; linkProposal: ILinkPredictionProposal | null; }>;
    toggleBookmark: (messageId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    updateMessage: (messageId: string, newContent: string) => Promise<void>;
    regenerateAiResponse: (messageId: string) => Promise<void>;
    regenerateUserPromptAndGetResponse: (messageId: string) => Promise<void>;
    clearMessages: (conversationId: string) => Promise<void>;
    
    startWorkflow: (prompt: Prompt, userInputs: Record<string, string>) => void;
    startAgentRun: (goal: string) => Promise<void>;
    
    setStatus: (status: Partial<IStatus>) => void;
    setToolState: (state: Partial<ToolState>) => void;
    setMemoryMonitorState: (tier: keyof MemoryMonitorState, status: ExecutionStatus, data?: any, error?: string) => void;
    clearError: () => void;
    
    setScrollToMessageId: (messageId: string | null) => void;
    setActiveSegmentId: (segmentId: string | null) => void;
}


const ConversationContext = createContext<ExtendedConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { log } = useLog();
    const { setActiveView } = useUIState();
    const { isLoading, setIsLoading, status, setStatus, clearError, backgroundTaskCount, startBackgroundTask, endBackgroundTask } = useAppStatus();
    
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
    const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    
    // Live Monitors
    const [toolState, setBaseToolState] = useState<ToolState>({ status: 'idle' });
    const [memoryMonitor, setMemoryMonitor] = useState<MemoryMonitorState>({
        semantic: { status: 'idle' },
        structured: { status: 'idle' },
        graph: { status: 'idle' },
        episodic: { status: 'idle' }
    });

    const setToolState = useCallback((newState: Partial<ToolState>) => {
        setBaseToolState(prev => ({ ...prev, ...newState }));
    }, []);

    const setMemoryMonitorState = useCallback((tier: keyof MemoryMonitorState, status: ExecutionStatus, data?: any, error?: string) => {
        setMemoryMonitor(prev => ({
            ...prev,
            [tier]: { status, data, error }
        }));
    }, []);

    const resetMonitors = useCallback(() => {
        setToolState({ status: 'idle', toolName: undefined, input: undefined, output: undefined, error: undefined });
        setMemoryMonitor({
            semantic: { status: 'idle' },
            structured: { status: 'idle' },
            graph: { status: 'idle' },
            episodic: { status: 'idle' }
        });
    }, [setToolState]);

    const onConversationCreated = useCallback((newConversation: Conversation) => {
        log('New conversation created, navigating...', { id: newConversation.id });
        setCurrentConversationId(newConversation.id);
        setActiveView('chat');
    }, [log, setActiveView]);

    const onConversationDeleted = useCallback((conversationId: string) => {
        log('Conversation deleted, clearing state if active...', { id: conversationId });
        if (currentConversationId === conversationId) {
            setCurrentConversationId(null);
        }
    }, [log, currentConversationId]);

    // FIX: Corrected the destructuring from useConversationList to not alias createNewConversation, resolving a reference error on line 219.
    const { conversations, loadConversations, createNewConversation, deleteConversation, updateConversationTitle, generateConversationTitle } = useConversationList({ 
        setIsLoading, 
        setStatus, 
        activeSegmentId, 
        onConversationCreated,
        onConversationDeleted
    });

    const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId) || null, [conversations, currentConversationId]);

    const { messages, setMessages, fetchMessages, addMessage: baseAddMessage, toggleBookmark, deleteMessage, updateMessage, regenerateAiResponse, regenerateUserPromptAndGetResponse, clearMessages } = useMessageManager({
        currentConversation, setStatus, setIsLoading, startBackgroundTask, endBackgroundTask, onNewMessageWhileHidden: (id) => setUnreadConversations(prev => new Set(prev).add(id))
    });

    useEffect(() => {
        if (!currentConversationId) {
            setMessages([]);
        }
    }, [currentConversationId, setMessages]);

    const addMessage = useCallback(async (msgData: any, mentioned: any, history: any, parent: any) => {
        resetMonitors();
        
        // Initial transition to executing
        setMemoryMonitorState('semantic', 'executing');
        setMemoryMonitorState('structured', 'executing');
        setMemoryMonitorState('graph', 'executing');
        setMemoryMonitorState('episodic', 'executing');

        const result = await baseAddMessage(msgData, mentioned, history, parent);
        
        // Populate monitor data from API results
        if (result.aiResponse && (result as any).monitorMetadata) {
            const meta = (result as any).monitorMetadata;
            setMemoryMonitorState('semantic', 'success', meta.semantic);
            setMemoryMonitorState('structured', 'success', meta.structured);
            setMemoryMonitorState('graph', 'success', meta.graph);
            setMemoryMonitorState('episodic', 'success', meta.episodic);
        } else if (!result.aiResponse) {
             setMemoryMonitorState('semantic', 'error', null, 'Failed to fetch AI response');
             setMemoryMonitorState('structured', 'error', null, 'Retrieval interrupted');
             setMemoryMonitorState('graph', 'error', null, 'Retrieval interrupted');
             setMemoryMonitorState('episodic', 'error', null, 'Retrieval interrupted');
        }
        
        return result;
    }, [baseAddMessage, resetMonitors, setMemoryMonitorState]);

    const { activeWorkflow, startWorkflow } = useWorkflowManager({ currentConversation, setStatus, addMessage, setMessages });

    const setCurrentConversationWithMessages = useCallback(async (id: string | null) => {
        setCurrentConversationId(id);
        if (id) {
            setActiveView('chat');
            setIsLoading(true);
            await fetchMessages(id);
            setIsLoading(false);
            setUnreadConversations(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } else {
            setMessages([]);
        }
    }, [fetchMessages, setIsLoading, setMessages, setActiveView]);

    const updateCurrentConversation = useCallback(async (updates: Partial<Conversation>) => {
        if (!currentConversationId) return;
        try {
            await fetch(`/api/conversations/${currentConversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            await loadConversations(activeSegmentId);
        } catch (error) {
            log('Failed to update conversation settings', { error }, 'error');
        }
    }, [currentConversationId, log, loadConversations, activeSegmentId]);

    const startAgentRun = useCallback(async (goal: string) => {
        setStatus({ currentAction: "Initiating autonomous agent..." });
        try {
            const res = await fetch('/api/agents/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, plan: [{ phase_order: 1, goal: "Initial research" }] }),
            });
            const newRun = await res.json();
            setActiveRunId(newRun.id);
        } catch (error) {
            log('Failed to start agent run', { error }, 'error');
        } finally {
            setStatus({ currentAction: "" });
        }
    }, [setStatus, log]);

    useEffect(() => {
        if(activeRunId) setActiveView('agent_center');
    }, [activeRunId, setActiveView]);
    
    const value: ExtendedConversationContextType = {
        conversations, currentConversation, messages, isLoading, status, toolState, memoryMonitor,
        backgroundTaskCount, activeWorkflow, unreadConversations, scrollToMessageId, activeSegmentId, activeRunId,
        setCurrentConversation: setCurrentConversationWithMessages,
        createNewConversation, deleteConversation, updateConversationTitle, generateConversationTitle, loadConversations, updateCurrentConversation,
        addMessage, toggleBookmark, deleteMessage, updateMessage, regenerateAiResponse, regenerateUserPromptAndGetResponse, clearMessages,
        startWorkflow, startAgentRun, setStatus, setToolState, setMemoryMonitorState, clearError, setScrollToMessageId, setActiveSegmentId,
    };
    
    return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) throw new Error('useConversation must be used within a ConversationProvider');
    return context;
};
