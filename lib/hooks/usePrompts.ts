

"use client";

import { useState, useCallback } from 'react';
// FIX: Added import for IStatus type.
import type { Prompt, IStatus } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
// FIX: Corrected relative import for useConversation.
import { useConversation } from '@/components/providers/ConversationProvider';

export const usePrompts = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPrompts = useCallback(async () => {
        clearError();
        log('Fetching all prompts...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/prompts');
            if (!res.ok) throw new Error('Failed to fetch prompts');
            const data = await res.json();
            setPrompts(data);
            log(`Successfully fetched ${data.length} prompts.`);
        } catch (error) {
            const errorMessage = 'Could not load prompts.';
            setStatus({ error: errorMessage });
            log(errorMessage, { error: { message: (error as Error).message } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    const handleSavePrompt = useCallback(async (promptToSave: Partial<Prompt>) => {
        if (!promptToSave.name || (promptToSave.type === 'single' && !promptToSave.content)) {
             setStatus({ error: 'Name and Content are required for a single prompt.' });
             return;
        }
        if (promptToSave.type === 'chain' && (!promptToSave.chain_definition || promptToSave.chain_definition.length === 0)) {
            setStatus({ error: 'A workflow must have at least one step.' });
            return;
        }
        
        clearError();
        const isUpdating = !!promptToSave.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} prompt...`, { promptData: promptToSave });

        const finalPrompt = { ...promptToSave };
        if (finalPrompt.type === 'chain') {
            finalPrompt.content = `This is a chained prompt with ${finalPrompt.chain_definition?.length || 0} step(s).`;
        }

        const url = isUpdating ? `/api/prompts/${promptToSave.id}` : '/api/prompts';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPrompt),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} prompt`);
            
            await fetchPrompts();
            setCurrentPrompt(null); // Close form on successful save
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} prompt.`, { error: { message: errorMessage } }, 'error');
        }
    }, [clearError, log, setStatus, fetchPrompts]);

    const handleDeletePrompt = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this prompt?')) {
            clearError();
            log(`Attempting to delete prompt with ID: ${id}`);
            try {
                const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete prompt');
                log('Prompt deleted successfully.', { id });
                if (currentPrompt?.id === id) setCurrentPrompt(null);
                await fetchPrompts();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete prompt.', { id, error: { message: errorMessage } }, 'error');
            }
        } else {
            log('User cancelled prompt deletion.', { id });
        }
    }, [clearError, log, setStatus, fetchPrompts, currentPrompt]);

    return {
        prompts,
        currentPrompt,
        setCurrentPrompt,
        isLoading,
        fetchPrompts,
        handleSavePrompt,
        handleDeletePrompt,
    };
};