"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon } from '@/components/Icons';
import { useNotification } from '@/lib/hooks/use-notifications';

interface SuggestedEntity {
    name: string;
    type: string;
    description: string;
}

interface AISuggestionModalProps {
    onClose: () => void;
    onEntityCreated: () => void;
}

const AISuggestionModal = ({ onClose, onEntityCreated }: AISuggestionModalProps) => {
    const [suggestions, setSuggestions] = useState<SuggestedEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const fetchSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/memory/suggest-entities');
            if (!res.ok) throw new Error('Failed to fetch suggestions');
            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);
    
    const handleCreate = async (entity: SuggestedEntity) => {
        try {
            const res = await fetch('/api/entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entity),
            });
            if (!res.ok) throw new Error('Failed to create entity');
            addNotification({ type: 'success', title: 'Entity Created', message: `"${entity.name}" saved to memory.` });
            setSuggestions(prev => prev.filter(s => s.name !== entity.name));
            onEntityCreated();
        } catch (err) {
            addNotification({ type: 'error', title: 'Creation Failed', message: (err as Error).message });
        }
    };

    const handleIgnore = (entityName: string) => {
        setSuggestions(prev => prev.filter(s => s.name !== entityName));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-purple-400" />
                        AI Entity Suggestions
                    </h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto space-y-3">
                    {isLoading && <p className="text-center text-gray-400 animate-pulse">AI is analyzing recent conversations...</p>}
                    {error && <p className="text-red-400 text-center">Error: {error}</p>}
                    {!isLoading && suggestions.length === 0 && (
                        <div className="text-center text-gray-500 py-16">
                            <h3 className="font-semibold text-lg">No New Entities Found</h3>
                            <p className="text-sm">The AI did not find any new, distinct entities in recent conversations.</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {suggestions.map((s, i) => (
                            <motion.div
                                key={s.name + i}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="bg-gray-900/50 p-4 rounded-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{s.name} <span className="text-sm font-mono text-indigo-400">({s.type})</span></h4>
                                        <p className="text-sm text-gray-400 mt-1">{s.description}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 ml-4">
                                        <button onClick={() => handleIgnore(s.name)} className="px-3 py-1 text-xs bg-gray-600 rounded-md">Ignore</button>
                                        <button onClick={() => handleCreate(s)} className="px-3 py-1 text-xs bg-green-600 rounded-md">Create</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </main>
            </motion.div>
        </motion.div>
    );
};

export default AISuggestionModal;
