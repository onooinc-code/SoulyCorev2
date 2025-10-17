
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLog } from './providers/LogProvider';
import { usePrompts } from '@/lib/hooks/usePrompts';
import { PromptFilterSidebar } from './prompts/PromptFilterSidebar';
import { PromptForm } from './prompts/PromptForm';
import { PromptList } from './prompts/PromptList';
import type { Prompt } from '@/lib/types';

const PromptsHub = () => {
    const { log } = useLog();
    
    // Data and actions from the custom hook
    const {
        prompts,
        currentPrompt,
        setCurrentPrompt,
        isLoading,
        fetchPrompts,
        handleSavePrompt,
        handleDeletePrompt,
    } = usePrompts();

    // Local state for UI filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<{ type: 'all' | 'folder' | 'tag'; value: string | null }>({ type: 'all', value: null });

    // Initial fetch
    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    // Derived state for filtering
    const singlePrompts = useMemo(() => prompts.filter(p => p.type === 'single'), [prompts]);
    
    const filteredPrompts = useMemo(() => {
        let filtered = prompts;

        if (activeFilter.type === 'folder') {
            filtered = filtered.filter(p => p.folder === activeFilter.value);
        } else if (activeFilter.type === 'tag') {
            filtered = filtered.filter(p => p.tags?.includes(activeFilter.value!));
        }
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(prompt => 
                prompt.name.toLowerCase().includes(lowercasedSearch) ||
                prompt.content.toLowerCase().includes(lowercasedSearch)
            );
        }
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [prompts, searchTerm, activeFilter]);

    const handleOpenForm = (prompt: Partial<Prompt> | null = null) => {
        if (prompt && currentPrompt?.id === prompt.id) {
            setCurrentPrompt(null);
            return;
        }
        const action = prompt ? 'edit' : 'new';
        log(`User opened prompt form for ${action} prompt.`, { promptId: prompt?.id });
        setCurrentPrompt(prompt || { type: 'single', name: '', content: '', chain_definition: [] });
    };

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Prompts Hub</h2>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <PromptFilterSidebar
                    prompts={prompts}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onAddPrompt={() => handleOpenForm()}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <AnimatePresence>
                        {currentPrompt && (
                            <PromptForm 
                                currentPrompt={currentPrompt}
                                setCurrentPrompt={setCurrentPrompt}
                                onSave={handleSavePrompt}
                                singlePrompts={singlePrompts}
                            />
                        )}
                    </AnimatePresence>

                    {isLoading ? (
                        <p className="text-center text-gray-400 py-8">Loading prompts...</p>
                    ) : (
                        <PromptList 
                            prompts={filteredPrompts}
                            onEdit={(prompt) => handleOpenForm(prompt)}
                            onDelete={handleDeletePrompt}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptsHub;
