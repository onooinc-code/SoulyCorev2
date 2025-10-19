"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Conversation, Message, Contact, IStatus, ActiveWorkflowState, Prompt } from '@/lib/types';
import { useAppStatus } from '@/lib/hooks/useAppStatus';
import { useConversationList } from '@/lib/hooks/useConversationList';
import { useMessageManager } from '@/lib/hooks/useMessageManager';
import { useWorkflowManager } from '@/lib/hooks/useWorkflowManager';
import { useLog } from './LogProvider';

interface ConversationContextType {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    status: IStatus;
    backgroundTaskCount: number;
    activeWorkflow: ActiveWorkflowState | null;
    unreadConversations: Set<string>;
    scrollToMessageId: string | null;
    activeSegmentId: string | null;

    setCurrentConversation: (id: string | null) => void;
    createNewConversation: () => void;
    deleteConversation: (id: string) => void;
    updateConversationTitle: (id: string, newTitle: string) => void;
    generateConversationTitle: (id: string) => void;
    loadConversations: (segmentId?: string | null) => Promise<void>;
    updateCurrentConversation: (updates: Partial<Conversation>) => void;
    
    addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>, mentionedContacts?: Contact[], historyOverride?: Message[], parentMessageId?: string | null) => Promise<{ aiResponse: string | null, suggestion: string | null }>;
    toggleBookmark: (messageId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    updateMessage: (messageId: string, newContent: string) => Promise<void>;
    regenerateAiResponse: (messageId: string) => Promise<void>;
    regenerateUserPromptAndGetResponse: (messageId: string) => Promise<void>;
    clearMessages: (conversationId: string) => Promise<void>;
    
    startWorkflow: (prompt: Prompt, userInputs: Record<string, string>) => void;
    
    setStatus: (status: Partial<IStatus>) => void;
    clearError: () => void;
    
    setScrollToMessageId: (messageId: string | null) => void;
    setActiveSegmentId: (segmentId: string | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { log } = useLog();
    const { isLoading, setIsLoading, status, setStatus, clearError, backgroundTaskCount, startBackgroundTask, endBackgroundTask } = useAppStatus();
    
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
    const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

    const onConversationDeleted = (deletedId: string) => {
        if (currentConversationId === deletedId) {
            setCurrentConversationId(null);
        }
    };
    
    const onConversationCreated = (newConversation: Conversation) => {
        setCurrentConversationId(newConversation.id);
    };

    const { conversations, loadConversations, createNewConversation, deleteConversation, updateConversationTitle, generateConversationTitle } = useConversationList({ setIsLoading, setStatus, activeSegmentId, onConversationDeleted, onConversationCreated });

    const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId) || null, [conversations, currentConversationId]);

    const onNewMessageWhileHidden = (conversationId: string) => {
        setUnreadConversations(prev => new Set(prev).add(conversationId));
    };

    const { messages, setMessages, fetchMessages, addMessage, toggleBookmark, deleteMessage, updateMessage, regenerateAiResponse, regenerateUserPromptAndGetResponse, clearMessages } = useMessageManager({
        currentConversation, setStatus, setIsLoading, startBackgroundTask, endBackgroundTask, onNewMessageWhileHidden
    });

    const { activeWorkflow, startWorkflow } = useWorkflowManager({ currentConversation, setStatus, addMessage, setMessages });

    const setCurrentConversationWithMessages = useCallback(async (id: string | null) => {
        setCurrentConversationId(id);
        if (id) {
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
    }, [fetchMessages, setIsLoading, setMessages]);

    const updateCurrentConversation = useCallback(async (updates: Partial<Conversation>) => {
        if (!currentConversationId) return;
        
        try {
            const res = await fetch(`/api/conversations/${currentConversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update conversation settings.');
            await loadConversations(activeSegmentId); // Reload to get fresh data
        } catch (error) {
            setStatus({ error: (error as Error).message });
            log('Failed to update conversation settings', { error }, 'error');
            loadConversations(activeSegmentId);
        }
    }, [currentConversationId, setStatus, log, loadConversations, activeSegmentId]);

    useEffect(() => {
        if (conversations.length > 0 && !currentConversationId) {
            // By default, don't select a conversation automatically to allow empty state.
            // User must click a conversation to load it.
        }
    }, [conversations, currentConversationId, setCurrentConversationWithMessages]);
    
    const value: ConversationContextType = {
        conversations,
        currentConversation,
        messages,
        isLoading,
        status,
        backgroundTaskCount,
        activeWorkflow,
        unreadConversations,
        scrollToMessageId,
        activeSegmentId,
        
        setCurrentConversation: setCurrentConversationWithMessages,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
        loadConversations,
        updateCurrentConversation,

        addMessage,
        toggleBookmark,
        deleteMessage,
        updateMessage,
        regenerateAiResponse,
        regenerateUserPromptAndGetResponse,
        clearMessages,

        startWorkflow,
        
        setStatus,
        clearError,
        
        setScrollToMessageId,
        setActiveSegmentId,
    };
    
    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) {
        throw new Error('useConversation must be used within a ConversationProvider');
    }
    return context;
};
