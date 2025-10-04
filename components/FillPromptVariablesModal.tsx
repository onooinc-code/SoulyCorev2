"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';
import type { Prompt } from '@/lib/types';

interface FillPromptVariablesModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: Prompt | null;
    variables: string[];
    onSubmit: (values: Record<string, string>) => void;
}

// FIX: Removed React.FC to fix framer-motion type inference issue.
const FillPromptVariablesModal = ({ isOpen, onClose, prompt, variables, onSubmit }: FillPromptVariablesModalProps) => {
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            const initialValues = variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {});
            setVariableValues(initialValues);
        }
    }, [isOpen, variables]);

    const handleValueChange = (variable: string, value: string) => {
        setVariableValues(prev => ({ ...prev, [variable]: value }));
    };

    const handleSubmit = () => {
        if (!prompt) return;
        // Pass the raw key-value pairs back to the parent for handling
        onSubmit(variableValues);
        onClose();
    };

    const allFieldsFilled = variables.every(v => variableValues[v]?.trim() !== '');

    return (
        <AnimatePresence>
            {isOpen && prompt && (
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
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Fill in Prompt Variables</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-3 bg-gray-900/50 rounded-md">
                            <p className="text-sm font-semibold text-gray-300 mb-1">{prompt.name}</p>
                            <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">{prompt.content}</p>
                        </div>

                        <div className="space-y-3">
                            {variables.map(variable => (
                                <div key={variable}>
                                    <label htmlFor={variable} className="block text-sm font-medium text-gray-400 mb-1 capitalize">{variable.replace(/_/g, ' ')}</label>
                                    <input
                                        id={variable}
                                        type="text"
                                        value={variableValues[variable] || ''}
                                        onChange={(e) => handleValueChange(variable, e.target.value)}
                                        className="w-full p-2 bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        autoFocus={variables.indexOf(variable) === 0}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm">Cancel</button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={!allFieldsFilled}
                                className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Use Prompt
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FillPromptVariablesModal;