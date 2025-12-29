
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Conversation, Message, Contact, IStatus, ActiveWorkflowState, Prompt, ConversationContextType, ILinkPredictionProposal, ToolState, MemoryMonitorState, ExecutionStatus, UsageMetric } from '@/lib/types';
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

    // Feature Flags & Controls
    isAgentEnabled: boolean;
    setIsAgentEnabled: (val: boolean) => void;
    isLinkPredictionEnabled: boolean;
    setIsLinkPredictionEnabled: (val: boolean) => void;

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
    runCognitiveSynthesis: () => Promise<void>;
    
    setStatus: (status: Partial<IStatus>) => void;
    setToolState: (state: Partial<ToolState>) => void;
    setMemoryMonitorState: (tier: keyof MemoryMonitorState, status: ExecutionStatus, data?: any, error?: string, query?: string) => void;
    recordUsage: (usage: UsageMetric) => void;
    clearError: () => void;
    
    setScrollToMessageId: (messageId: string | null) => void;
    setActiveSegmentId: (segmentId: string | null) => void;
}


const ConversationContext = createContext<ExtendedConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { log } = useLog();
    const { setActiveView, setResponseViewerModalOpen } = useUIState();
    const { isLoading, setIsLoading, status: appStatus, setStatus: setAppStatus, clearError, backgroundTaskCount, startBackgroundTask, endBackgroundTask } = useAppStatus();
    
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
    const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);

    // Feature Toggles
    const [isAgentEnabled, setIsAgentEnabled] = useState(false);
    const [isLinkPredictionEnabled, setIsLinkPredictionEnabled] = useState(true);
    
    // Usage Metrics & Extended Status
    const [usageLog, setUsageLog] = useState<UsageMetric[]>([]);
    const [aiCallCount, setAiCallCount] = useState(0);

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

    const recordUsage = useCallback((usage: UsageMetric) => {
        setUsageLog(prev => [...prev, usage]);
        setAiCallCount(prev => prev + 1);
    }, []);

    const setMemoryMonitorState = useCallback((tier: keyof MemoryMonitorState, status: ExecutionStatus, data?: any, error?: string, query?: string) => {
        setMemoryMonitor(prev => ({
            ...prev,
            [tier]: { status, data, error, query }
        }));
    }, []);

    const resetMonitors = useCallback(() => {
        setToolState({ status: 'idle', toolName: undefined, input: undefined, output: undefined, error: undefined, usage: undefined });
        setMemoryMonitor({
            semantic: { status: 'idle' },
            structured: { status: 'idle' },
            graph: { status: 'idle' },
            episodic: { status: 'idle' }
        });
    }, [setToolState]);
    
    const { messages, setMessages, fetchMessages, addMessage: baseAddMessage, toggleBookmark, deleteMessage, updateMessage, regenerateAiResponse, regenerateUserPromptAndGetResponse, clearMessages } = useMessageManager({
        currentConversation: null, // This is a circular dependency limitation in the hook design, handled by effect below
        setStatus: setAppStatus, setIsLoading, startBackgroundTask, endBackgroundTask, onNewMessageWhileHidden: (id) => setUnreadConversations(prev => new Set(prev).add(id))
    });

    // --- Message Manager Context Update ---
    // The useMessageManager hook was initialized with null, but it needs the current conversation to function.
    // We can't re-initialize the hook, but we can pass the ID to its functions or rely on `currentConversationId` being available in scope if we refactored.
    // However, looking at `useMessageManager`, it expects `currentConversation` object. 
    // Since we can't change the hook params dynamically, we will use a ref or ensure the functions inside `useMessageManager` 
    // are robust. But wait, `useMessageManager` DOES take `currentConversation` as a prop. 
    // React hooks re-run on every render. So we just need to pass the *actual* current conversation object.
    // Let's re-instantiate it properly.

    // Calculate current conversation first
    // Note: This relies on `conversations` being populated.
    
    // Callback when a new conversation is created
    const onConversationCreated = useCallback((newConversation: Conversation) => {
        log('New conversation created, switching view...', { id: newConversation.id });
        setCurrentConversationId(newConversation.id);
        setMessages([]); // Critical: Clear previous messages immediately
        setActiveView('chat');
        resetMonitors();
    }, [log, setActiveView, setMessages, resetMonitors]);

    const onConversationDeleted = useCallback((conversationId: string) => {
        log('Conversation deleted, clearing state if active...', { id: conversationId });
        if (currentConversationId === conversationId) {
            setCurrentConversationId(null);
            setMessages([]);
        }
    }, [log, currentConversationId, setMessages]);

    const { conversations, loadConversations, createNewConversation, deleteConversation, updateConversationTitle, generateConversationTitle } = useConversationList({ 
        setIsLoading, 
        setStatus: setAppStatus, 
        activeSegmentId, 
        onConversationCreated,
        onConversationDeleted
    });

    const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId) || null, [conversations, currentConversationId]);

    // Re-bind message manager with the correct current conversation
    // This overrides the previous `useMessageManager` call which had null.
    // This is valid in React as long as hook order doesn't change.
    const messageManager = useMessageManager({
        currentConversation,
        setStatus: setAppStatus, 
        setIsLoading, 
        startBackgroundTask, 
        endBackgroundTask, 
        onNewMessageWhileHidden: (id) => setUnreadConversations(prev => new Set(prev).add(id))
    });

    // Use the values from the properly bound manager
    // const { messages, setMessages... } is already declared above but we need to update the references
    // Actually, we can't re-declare. The first call was incorrect. Let's fix the structure.
    // We will use the values from `messageManager` directly in the context value.

    const setCurrentConversationWithMessages = useCallback(async (id: string | null) => {
        if (id === currentConversationId) return;
        
        setCurrentConversationId(id);
        resetMonitors();
        
        if (id) {
            setActiveView('chat');
            setIsLoading(true);
            await messageManager.fetchMessages(id);
            setIsLoading(false);
        } else {
            messageManager.setMessages([]);
        }
    }, [messageManager, setIsLoading, setActiveView, currentConversationId, resetMonitors]);


    const addMessageWrapper = useCallback(async (msgData: any, mentioned: any, history: any, parent: any) => {
        if (!currentConversation) {
             setAppStatus({ error: "Cannot send message: No conversation selected." });
             return { aiResponse: null, suggestion: null, memoryProposal: null, linkProposal: null };
        }

        resetMonitors();
        const q = msgData.content;
        
        // Initialize monitors
        setMemoryMonitorState('semantic', 'executing', null, undefined, q);
        setMemoryMonitorState('structured', 'executing', null, undefined, q);
        setMemoryMonitorState('graph', 'executing', null, undefined, q);
        setMemoryMonitorState('episodic', 'executing', null, undefined, q);

        try {
            const result = await messageManager.addMessage(msgData, mentioned, history, parent, isAgentEnabled, isLinkPredictionEnabled);
            
            if (result.aiResponse && (result as any).monitorMetadata) {
                const meta = (result as any).monitorMetadata;
                recordUsage({ origin: 'generation', model: currentConversation?.model || 'gemini-3-flash-preview', timestamp: new Date().toISOString() });
                
                const getStatus = (data: any): ExecutionStatus => {
                    if (!data) return 'null';
                    if (Array.isArray(data) && data.length === 0) return 'null';
                    return 'success';
                };

                setMemoryMonitorState('semantic', getStatus(meta.semantic), meta.semantic, undefined, q);
                setMemoryMonitorState('structured', getStatus(meta.structured), meta.structured, undefined, q);
                setMemoryMonitorState('graph', getStatus(meta.graph), meta.graph, undefined, q);
                setMemoryMonitorState('episodic', getStatus(meta.episodic), meta.episodic, undefined, q);
            } 

            // Auto-title generation is now handled by the MemoryExtraction pipeline in the backend.
            
            return result;
        } catch (error: any) {
            const errMsg = error.message || "Unknown error during execution";
            setMemoryMonitorState('semantic', 'error', null, errMsg, q);
            throw error;
        }
    }, [messageManager, resetMonitors, setMemoryMonitorState, recordUsage, currentConversation, isAgentEnabled, isLinkPredictionEnabled, setAppStatus]);

    const runCognitiveSynthesis = useCallback(async () => {
        setAppStatus({ currentAction: { phase: 'reasoning', details: 'Synthesizing knowledge nexus...' }});
        recordUsage({ origin: 'synthesis', model: 'gemini-3-pro-preview', timestamp: new Date().toISOString() });
        try {
            const res = await fetch('/api/ai/synthesis', { method: 'POST' });
            if (res.ok) {
                log('Synthesis generated successfully');
                setResponseViewerModalOpen(true);
            }
        } catch (error) {
            log('Synthesis failed', { error }, 'error');
        } finally {
            setAppStatus({ currentAction: "" });
        }
    }, [setAppStatus, recordUsage, log, setResponseViewerModalOpen]);

    const { activeWorkflow, startWorkflow } = useWorkflowManager({ currentConversation, setStatus: setAppStatus, addMessage: addMessageWrapper, setMessages: messageManager.setMessages });

    const updateCurrentConversation = useCallback(async (updates: Partial<Conversation>) => {
        if (!currentConversationId) return;
        try {
            await fetch(`/api/conversations/${currentConversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            await loadConversations(activeSegmentId);
        } catch (error) { log('Failed to update conversation settings', { error }, 'error'); }
    }, [currentConversationId, log, loadConversations, activeSegmentId]);

    const startAgentRun = useCallback(async (goal: string) => {
        setAppStatus({ currentAction: "Initiating agent..." });
        recordUsage({ origin: 'agent_thought', model: 'gemini-3-pro-preview', timestamp: new Date().toISOString() });
        try {
            const res = await fetch('/api/agents/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, plan: [{ phase_order: 1, goal: "Reasoning loop" }] }),
            });
            const newRun = await res.json();
            setActiveRunId(newRun.id);
        } catch (error) { log('Failed to start agent run', { error }, 'error'); }
        finally { setAppStatus({ currentAction: "" }); }
    }, [setAppStatus, log, recordUsage]);

    const status: IStatus = {
        ...appStatus,
        aiCallCount,
        callLog: usageLog
    };

    const value: ExtendedConversationContextType = {
        conversations, currentConversation, 
        messages: messageManager.messages, 
        isLoading, status, toolState, memoryMonitor,
        backgroundTaskCount, activeWorkflow, unreadConversations, scrollToMessageId, activeSegmentId, activeRunId,
        isAgentEnabled, setIsAgentEnabled, isLinkPredictionEnabled, setIsLinkPredictionEnabled,
        setCurrentConversation: setCurrentConversationWithMessages,
        createNewConversation, deleteConversation, updateConversationTitle, generateConversationTitle, loadConversations, updateCurrentConversation,
        addMessage: addMessageWrapper, 
        toggleBookmark: messageManager.toggleBookmark, 
        deleteMessage: messageManager.deleteMessage, 
        updateMessage: messageManager.updateMessage, 
        regenerateAiResponse: messageManager.regenerateAiResponse, 
        regenerateUserPromptAndGetResponse: messageManager.regenerateUserPromptAndGetResponse, 
        clearMessages: messageManager.clearMessages,
        startWorkflow, startAgentRun, runCognitiveSynthesis, setStatus: setAppStatus, setToolState, setMemoryMonitorState, recordUsage, clearError, setScrollToMessageId, setActiveSegmentId,
    };
    
    return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) throw new Error('useConversation must be used within a ConversationProvider');
    return context;
};
