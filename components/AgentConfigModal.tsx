

"use client";

import React, { useState, useEffect } from 'react';
import { Conversation } from '@/lib/types';
import { XIcon } from './Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from './providers/LogProvider';

const AgentConfigModal = ({ isOpen, onClose, conversation }: { isOpen: boolean; onClose: () => void; conversation: Conversation | null; }) => {
    const { updateCurrentConversation, setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [systemPrompt, setSystemPrompt] = useState('');
    const [useSemanticMemory, setUseSemanticMemory] = useState(false);
    const [useStructuredMemory, setUseStructuredMemory] = useState(true);
    const [enableMemoryExtraction, setEnableMemoryExtraction] = useState(true);
    const [enableProactiveSuggestions, setEnableProactiveSuggestions] = useState(true);
    const [enableAutoSummarization, setEnableAutoSummarization] = useState(true);
    
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [modelOverrides, setModelOverrides] = useState({
        responseGeneration: '',
        contextAssembly: '',
        memoryExtraction: ''
    });

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models');
                if (!res.ok) throw new Error("Failed to fetch models");
                const data = await res.json();
                setAvailableModels(data);
            } catch (error) {
                log('Failed to fetch available models for agent config', { error }, 'error');
            }
        };
        if (isOpen) {
            fetchModels();
        }
    }, [isOpen, log]);

    useEffect(() => {
        if (conversation && isOpen) {
            setSystemPrompt(conversation.systemPrompt || 'You are a helpful AI assistant.');
            setUseSemanticMemory(conversation.useSemanticMemory ?? true);
            setUseStructuredMemory(conversation.useStructuredMemory ?? true);
            setEnableMemoryExtraction(conversation.enableMemoryExtraction ?? true);
            setEnableProactiveSuggestions(conversation.enableProactiveSuggestions ?? true);
            setEnableAutoSummarization(conversation.enableAutoSummarization ?? true);
            setModelOverrides({
                responseGeneration: conversation.ui_settings?.model_for_response || '',
                contextAssembly: conversation.ui_settings?.model_for_context || '',
                memoryExtraction: conversation.ui_settings?.model_for_memory || '',
            });
        }
    }, [conversation, isOpen]);

    const handleSave = async () => {
        if (!conversation) return;
        clearError();
        
        const updatedConversationData = {
            systemPrompt,
            useSemanticMemory,
            useStructuredMemory,
            enableMemoryExtraction,
            enableProactiveSuggestions,
            enableAutoSummarization,
            ui_settings: {
                ...conversation.ui_settings,
                model_for_response: modelOverrides.responseGeneration,
                model_for_context: modelOverrides.contextAssembly,
                model_for_memory: modelOverrides.memoryExtraction,
            }
        };
        
        log('User clicked "Save" in Agent Config Modal', { conversationId: conversation.id, updatedData: updatedConversationData });
        
        updateCurrentConversation(updatedConversationData);
        onClose();

        try {
            const res = await fetch(`/api/conversations/${conversation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConversationData)
            });

            if (!res.ok) throw new Error('Failed to update agent configuration');
            
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to save agent configuration', { error: { message: errorMessage } }, 'error');
        }
    };

    const ModelOverrideSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; }) => (
         <div>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <select value={value} onChange={onChange} className="w-full p-2 bg-gray-700 rounded-lg text-sm">
                <option value="">Use Conversation Default ({conversation?.model})</option>
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
    );

    return (
        <AnimatePresence>
        {isOpen && conversation && (
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel rounded-lg shadow-xl w-11/12 md:max-w-3xl max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                        <h2 className="text-xl font-bold">Agent Configuration</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div>
                            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-400 mb-1">System Instructions</label>
                            <textarea id="systemPrompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4} className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>

                         <div className="p-4 bg-gray-900/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-300 mb-3">Multi-Model Strategy</h3>
                            <p className="text-xs text-gray-400 mb-4">Optionally override the model for specific cognitive tasks. If blank, the conversation's default model will be used.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <ModelOverrideSelect label="Response Generation" value={modelOverrides.responseGeneration} onChange={e => setModelOverrides(s => ({...s, responseGeneration: e.target.value}))}/>
                               <ModelOverrideSelect label="Context Assembly" value={modelOverrides.contextAssembly} onChange={e => setModelOverrides(s => ({...s, contextAssembly: e.target.value}))}/>
                               <ModelOverrideSelect label="Memory Extraction" value={modelOverrides.memoryExtraction} onChange={e => setModelOverrides(s => ({...s, memoryExtraction: e.target.value}))}/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-300 mb-2">Memory Association</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={useSemanticMemory} onChange={e => setUseSemanticMemory(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Semantic Memory (Knowledge)</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={useStructuredMemory} onChange={e => setUseStructuredMemory(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Structured Memory (Entities)</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-300 mb-2">Smart Features</h3>
                                 <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={enableMemoryExtraction} onChange={e => setEnableMemoryExtraction(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Memory Extraction</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={enableProactiveSuggestions} onChange={e => setEnableProactiveSuggestions(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Proactive Suggestions</span>
                                    </label>
                                     <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={enableAutoSummarization} onChange={e => setEnableAutoSummarization(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                        <span>Auto-Collapse Summaries</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 p-6 mt-auto border-t border-gray-700 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};

export default AgentConfigModal;