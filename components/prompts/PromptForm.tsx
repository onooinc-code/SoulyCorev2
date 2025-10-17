"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { Prompt, PromptChainStep, Tool } from '@/lib/types';
import { WorkflowBuilder } from './WorkflowBuilder';
import { useConversation } from '@/components/providers/ConversationProvider';

interface PromptFormProps {
    currentPrompt: Partial<Prompt>;
    setCurrentPrompt: (prompt: Partial<Prompt> | null) => void;
    onSave: (prompt: Partial<Prompt>) => void;
    singlePrompts: Prompt[];
    tools: Tool[];
}

export const PromptForm = ({ currentPrompt, setCurrentPrompt, onSave, singlePrompts, tools }: PromptFormProps) => {
    const { setStatus } = useConversation();

    const handleChainDefinitionChange = (newChain: PromptChainStep[]) => {
        setCurrentPrompt({ ...currentPrompt, chain_definition: newChain });
    };

    const handleSavePrompt = () => {
        // Basic client-side check, robust validation is in the hook.
        if (!currentPrompt.name) {
            setStatus({ error: "Prompt name cannot be empty."});
            return;
        }
        onSave(currentPrompt);
    }
    
    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden flex-shrink-0"
        >
            <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
                <h3 className="font-semibold text-lg">{currentPrompt.id ? 'Edit Prompt' : 'New Prompt'}</h3>
                <div className="flex items-center gap-4 text-sm">
                    <span>Type:</span>
                    <label className="flex items-center gap-2">
                        <input type="radio" value="single" checked={currentPrompt.type === 'single'} onChange={() => setCurrentPrompt({ ...currentPrompt, type: 'single' })} />
                        Single
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" value="chain" checked={currentPrompt.type === 'chain'} onChange={() => setCurrentPrompt({ ...currentPrompt, type: 'chain', chain_definition: currentPrompt.chain_definition || [] })} />
                        Workflow (Chain)
                    </label>
                </div>
                <input value={currentPrompt.name || ''} onChange={e => setCurrentPrompt({ ...currentPrompt, name: e.target.value })} placeholder="Prompt Name (e.g., 'Meeting Summarizer')" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                
                {currentPrompt.type === 'single' ? (
                    <textarea value={currentPrompt.content || ''} onChange={e => setCurrentPrompt({ ...currentPrompt, content: e.target.value })} placeholder="Prompt Content..." className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={5}></textarea>
                ) : (
                    <WorkflowBuilder 
                        chainDefinition={currentPrompt.chain_definition || []}
                        onChainChange={handleChainDefinitionChange}
                        singlePrompts={singlePrompts}
                        tools={tools}
                    />
                )}
                
                <div className="flex gap-4">
                    <input value={currentPrompt.folder || ''} onChange={e => setCurrentPrompt({ ...currentPrompt, folder: e.target.value })} placeholder="Folder (Optional)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    <input value={currentPrompt.tags?.join(', ') || ''} onChange={e => setCurrentPrompt({ ...currentPrompt, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="Tags, comma-separated" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSavePrompt} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Prompt</button>
                    <button onClick={() => setCurrentPrompt(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                </div>
            </div>
        </motion.div>
    );
};