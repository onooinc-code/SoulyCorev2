"use client";

import React, { useState, useEffect } from 'react';
// FIX: Corrected a relative import path for the `XIcon` component to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { XIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Corrected relative import for useConversation.
import { useConversation } from '@/components/providers/ConversationProvider';
// FIX: Corrected import path for type.
import { Conversation } from '@/lib/types';

interface AgentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
}

const AgentConfigModal = ({ isOpen, onClose, conversation }: AgentConfigModalProps) => {
    const { updateCurrentConversation, setStatus } = useConversation();
    const [systemPrompt, setSystemPrompt] = useState('');
    const [useSemantic, setUseSemantic] = useState(true);
    const [useStructured, setUseStructured] = useState(true);

    useEffect(() => {
        if (isOpen && conversation) {
            setSystemPrompt(conversation.systemPrompt || '');
            setUseSemantic(conversation.useSemanticMemory ?? true);
            setUseStructured(conversation.useStructuredMemory ?? true);
        }
    }, [isOpen, conversation]);

    const handleSave = () => {
        if (!conversation) return;
        updateCurrentConversation({
            systemPrompt,
            useSemanticMemory: useSemantic,
            useStructuredMemory: useStructured,
        });
        setStatus({ currentAction: "Agent config saved." });
        onClose();
    };

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
                        className="glass-panel rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Agent Configuration</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div>
                            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-400 mb-1">System Instructions</label>
                            <textarea
                                id="systemPrompt"
                                value={systemPrompt}
                                onChange={e => setSystemPrompt(e.target.value)}
                                placeholder="e.g., You are a helpful AI assistant that specializes in software engineering."
                                className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-400">Memory Access</h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={useSemantic} onChange={e => setUseSemantic(e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                <span>Use Semantic Memory (Knowledge Base)</span>
                            </label>
                             <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={useStructured} onChange={e => setUseStructured(e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                <span>Use Structured Memory (Entities & Contacts)</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
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