"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import type { Conversation, Message, ActiveWorkflowState, IStatus } from '@/lib/types';
import { useLog } from './LogProvider';
import { useAppStatus } from '@/lib/hooks/useAppStatus';
import { useConversationList } from '@/lib/hooks/useConversationList';
import { useMessageManager } from '@/lib/hooks/useMessageManager';
import { useWorkflowManager } from '@/lib/hooks/useWorkflowManager';

// The context type definition remains comprehensive, combining the outputs of all hooks.
interface ConversationContextType {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setCurrentConversation: (conversationId: string | null) => void;
    updateCurrentConversation: (updatedData: Partial<Conversation>) => void;
    createNewConversation: () => Promise<void>;
    addMessage: ReturnType<typeof useMessageManager>['addMessage'];
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
    startWorkflow: ReturnType<typeof useWorkflowManager>['startWorkflow'];
    activeWorkflow: ActiveWorkflowState | null;
    scrollToMessageId: string | null;
    setScrollToMessageId: (messageId: string | null) => void;
    fetchMessages: (conversationId: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { log } = useLog();
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [unreadConversations, setUnreadConversations] = useState(new Set<string>());
    const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);

    // --- HOOKS COMPOSITION ---
    const { 
        isLoading, setIsLoading, status, setStatus, clearError, 
        backgroundTaskCount, startBackgroundTask, endBackgroundTask 
    } = useAppStatus();

    const { 
        conversations, loadConversations, createNewConversation, 
        deleteConversation, updateConversationTitle, generateConversationTitle 
    } = useConversationList({
        setIsLoading,
        setStatus,
        onConversationDeleted: (conversationId) => {
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(null);
            }
        },
        onConversationCreated: (newConversation) => {
            // This callback sets the new conversation as active after creation
            setCurrentConversation(newConversation);
        }
    });

    const { 
        messages, setMessages, fetchMessages, addMessage, toggleBookmark, 
        deleteMessage, updateMessage, regenerateAiResponse, 
        regenerateUserPromptAndGetResponse, clearMessages 
    } = useMessageManager({
        currentConversation,
        setStatus,
        setIsLoading,
        startBackgroundTask,
        endBackgroundTask,
        onNewMessageWhileHidden: (conversationId) => {
             setUnreadConversations(prev => new Set(prev).add(conversationId));
        }
    });

    const { activeWorkflow, startWorkflow } = useWorkflowManager({
        currentConversation,
        setStatus,
        addMessage,
        setMessages,
    });
    
    // --- ORCHESTRATION LOGIC ---
    // This logic remains in the provider as it connects the conversation list to the message list.
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
            // fetchMessages is now handled by the useEffect below
        }
    }, [conversations, setMessages]);
    
    // This effect ensures the `currentConversation` object in state is always the latest version from the list.
     useEffect(() => {
        if (currentConversation) {
            const updatedConvoInList = conversations.find(c => c.id === currentConversation.id);
            if (updatedConvoInList && JSON.stringify(updatedConvoInList) !== JSON.stringify(currentConversation)) {
                setCurrentConversation(updatedConvoInList);
            }
        }
    }, [conversations, currentConversation]);
    
    // This effect triggers fetching messages when the active conversation changes.
    useEffect(() => {
        if (currentConversation) {
            fetchMessages(currentConversation.id);
        } else {
            setMessages([]); // Clear messages if no conversation is selected
        }
    }, [currentConversation?.id, fetchMessages, setMessages]);

    // Initial load of conversations.
    useEffect(() => { loadConversations() }, [loadConversations]);

    // This logic remains in the provider to orchestrate optimistic UI updates and debounced saving.
    const updateCurrentConversation = useCallback((updatedData: Partial<Conversation>) => {
        if (currentConversation) {
            // Optimistic update for immediate UI feedback
            const newConversation = { ...currentConversation, ...updatedData };
            setCurrentConversation(newConversation);
            
            // Debounced save to database
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

            debounceTimeout.current = setTimeout(async () => {
                log('Debounced save triggered for conversation.', { id: newConversation.id, changes: updatedData });
                try {
                    const res = await fetch(`/api/conversations/${newConversation.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });
                    if (!res.ok) throw new Error('Failed to save conversation changes to the database.');
                    // Refresh the entire list from DB to ensure consistency
                    await loadConversations();
                } catch (error) {
                    log('Failed to save conversation changes.', { error: (error as Error).message }, 'error');
                    setStatus({ error: 'Could not save conversation changes.' });
                }
            }, 1500); // 1.5 second debounce delay
        }
    }, [currentConversation, log, setStatus, loadConversations]);


    const contextValue = {
        conversations, currentConversation, messages,
        setCurrentConversation: setCurrentConversationById,
        updateCurrentConversation, createNewConversation, addMessage, toggleBookmark, loadConversations,
        isLoading, status, setStatus, clearError,
        deleteConversation, updateConversationTitle, generateConversationTitle, deleteMessage, updateMessage,
        regenerateAiResponse, regenerateUserPromptAndGetResponse, unreadConversations, clearMessages,
        backgroundTaskCount, startBackgroundTask, endBackgroundTask, startWorkflow, activeWorkflow,
        scrollToMessageId, setScrollToMessageId,
        fetchMessages,
    };

    return <ConversationContext.Provider value={contextValue}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (context === undefined) throw new Error('useConversation must be used within a ConversationProvider');
    return context;
};