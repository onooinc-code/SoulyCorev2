"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, BeakerIcon } from '../Icons';
import { useNotification } from '@/lib/hooks/use-notifications';

interface SuggestedCategory {
    name: string;
    entities: { id: string; name: string }[];
}

interface AICategorizerModalProps {
    onClose: () => void;
}

const AICategorizerModal = ({ onClose }: AICategorizerModalProps) => {
    const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const fetchSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/entities/suggest-categories');
            if (!res.ok) throw new Error('Failed to fetch category suggestions.');
            const data = await res.json();
            setSuggestions(data.categories);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    const handleApplyCategory = async (category: SuggestedCategory) => {
        const ids = category.entities.map(e => e.id);
        if (ids.length === 0) return;

        try {
            const res = await fetch('/api/entities/bulk-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change_type', ids, payload: { newType: category.name } }),
            });
            if (!res.ok) throw new Error('Failed to apply new category.');

            addNotification({ type: 'success', title: 'Category Applied', message: `Updated ${ids.length} entities to type "${category.name}".` });
            
            // Remove the applied category from the list
            setSuggestions(prev => prev.filter(s => s.name !== category.name));

        } catch (err) {
            addNotification({ type: 'error', title: 'Apply Failed', message: (err as Error).message });
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BeakerIcon className="w-5 h-5 text-indigo-400" />
                        AI Category Suggestions
                    </h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto space-y-4">
                    {isLoading && <p className="text-center text-gray-400 animate-pulse">AI is analyzing your entities...</p>}
                    {error && <p className="text-red-400 text-center">Error: {error}</p>}
                    {!isLoading && suggestions.length === 0 && (
                        <div className="text-center text-gray-500 py-16">
                            <h3 className="font-semibold text-lg">No Clear Categories Found</h3>
                            <p className="text-sm">The AI could not identify any distinct groups among your entities at this time.</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {suggestions.map((category) => (
                            <motion.div
                                key={category.name}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="bg-gray-900/50 p-4 rounded-lg"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-xs text-gray-400">Suggested Category</p>
                                        <h3 className="font-semibold text-indigo-300">{category.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleApplyCategory(category)}
                                        className="px-3 py-1 text-xs bg-green-600 rounded-md hover:bg-green-500"
                                    >
                                        Apply Category
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {category.entities.map(entity => (
                                        <span key={entity.id} className="text-sm bg-gray-700 px-2 py-1 rounded-md">{entity.name}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </main>
                <footer className="p-2 border-t border-gray-700 text-center">
                    <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">Close</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default AICategorizerModal;