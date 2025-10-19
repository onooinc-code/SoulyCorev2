"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Conversation, IStatus } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

interface UseConversationListProps {
    setIsLoading: (loading: boolean) => void;
    setStatus: (status: Partial<IStatus>) => void;
    activeSegmentId: string | null;
    onConversationDeleted: (conversationId: string) => void;
    onConversationCreated: (conversation: Conversation) => void;
}

/**
 * A custom hook responsible for managing the state and API interactions for the list of conversations.
 */
export const useConversationList = ({ setIsLoading, setStatus, activeSegmentId, onConversationDeleted, onConversationCreated }: UseConversationListProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const { log } = useLog();

    const loadConversations = useCallback(async (segmentId?: string | null) => {
        log('Fetching conversation list...', { segmentId });
        try {
            let url = '/api/conversations';
            if (segmentId) {
                url += `?segmentId=${segmentId}`;
            }
            const response = await fetch(url);
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
        loadConversations(activeSegmentId);
    }, [activeSegmentId, loadConversations]);

    const createNewConversation = useCallback(async () => {
        setIsLoading(true);
        setStatus({ currentAction: "Creating new chat..." });
        try {
            const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to create conversation');
            const newConversation: Conversation = await res.json();
            await loadConversations();
            onConversationCreated(newConversation);
        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    }, [setIsLoading, setStatus, loadConversations, onConversationCreated, log]);

    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete conversation.');
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            onConversationDeleted(conversationId);
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    }, [setStatus, onConversationDeleted]);

    const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c));
        try {
            await fetch(`/api/conversations/${conversationId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
        } catch (error) {
            log('Failed to save updated title to DB.', { error }, 'error');
            loadConversations();
        }
    }, [log, loadConversations]);

    const generateConversationTitle = useCallback(async (conversationId: string) => {
        setStatus({ currentAction: 'Generating title...' });
        try {
            const res = await fetch(`/api/conversations/${conversationId}/generate-title`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate title.');
            const updatedConversation: Conversation = await res.json();
            setConversations(prev => prev.map(c => c.id === conversationId ? updatedConversation : c));
        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setStatus({ currentAction: '' });
        }
    }, [setStatus]);

    return {
        conversations,
        loadConversations,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
    };
};