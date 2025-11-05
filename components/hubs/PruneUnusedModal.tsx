"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TrashIcon } from '../Icons';
import { EntityDefinition } from '@/lib/types';

const PruneUnusedModal = ({ onClose }: { onClose: () => void }) => {
    const [entities, setEntities] = useState<EntityDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchUnused = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/entities/unused');
            if (!res.ok) throw new Error('Failed to fetch unused entities');
            const data = await res.json();
            setEntities(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnused();
    }, [fetchUnused]);
    
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === entities.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(entities.map(e => e.id)));
        }
    };
    
    const handleDeleteSelected = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${ids.length} unused entities? This action cannot be undone.`)) return;

        try {
            const res = await fetch('/api/entities/bulk-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', ids }),
            });
            if (!res.ok) throw new Error('Bulk delete failed.');
            setSelectedIds(new Set());
            await fetchUnused();
            onClose(); // Close on success
        } catch (err) {
            setError(`Delete failed: ${(err as Error).message}`);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">Prune Unused Entities</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto space-y-2">
                    <p className="text-sm text-gray-400 mb-4">The following entities have no relationships and have never been mentioned in a conversation. They can be safely deleted.</p>
                    {isLoading && <p>Searching for unused entities...</p>}
                    {error && <p className="text-red-400">Error: {error}</p>}
                    {!isLoading && entities.length === 0 && <p className="text-center text-gray-500 py-8">No unused entities found.</p>}
                    <AnimatePresence>
                        {entities.map((entity) => (
                            <motion.div key={entity.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className={`p-2 rounded-md flex items-center gap-3 transition-colors ${selectedIds.has(entity.id) ? 'bg-indigo-900/50' : 'bg-gray-700/50'}`}>
                                <input type="checkbox" checked={selectedIds.has(entity.id)} onChange={() => toggleSelection(entity.id)} className="bg-gray-800 border-gray-600 rounded" />
                                <div className="flex-1">
                                    <span className="font-semibold">{entity.name}</span>
                                    <span className="ml-2 text-xs text-gray-400 font-mono">({entity.type})</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </main>
                 <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <div>
                        <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === entities.length && entities.length > 0} className="mr-2 bg-gray-800 border-gray-600 rounded" />
                        <label className="text-sm">Select All</label>
                    </div>
                    <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50">
                        <TrashIcon className="w-4 h-4"/> Delete ({selectedIds.size}) Selected
                    </button>
                 </footer>
            </motion.div>
        </motion.div>
    );
};

export default PruneUnusedModal;