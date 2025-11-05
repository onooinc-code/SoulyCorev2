"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ArrowsRightLeftIcon } from '../Icons';
import { EntityDefinition } from '@/lib/types';

interface DuplicatePair {
    entity1: EntityDefinition;
    entity2: EntityDefinition;
    similarity: number;
}

const DuplicateFinderModal = ({ onClose }: { onClose: () => void }) => {
    const [pairs, setPairs] = useState<DuplicatePair[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mergingPair, setMergingPair] = useState<{ entity1: EntityDefinition; entity2: EntityDefinition } | null>(null);

    const findDuplicates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/entities/duplicates');
            if (!res.ok) throw new Error('Failed to fetch duplicates');
            const data = await res.json();
            setPairs(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        findDuplicates();
    }, [findDuplicates]);

    const handleConfirmMerge = async (targetId: string, sourceId: string) => {
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, sourceId }),
            });
            if (!res.ok) throw new Error('Merge failed');
            setMergingPair(null);
            await findDuplicates(); // Refresh the list
        } catch (err) {
            setError(`Merge failed: ${(err as Error).message}`);
        }
    };
    
    const handleIgnore = (pairToIgnore: DuplicatePair) => {
        setPairs(prev => prev.filter(p => !(p.entity1.id === pairToIgnore.entity1.id && p.entity2.id === pairToIgnore.entity2.id)));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">Find Duplicate Entities</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto space-y-4">
                    {isLoading && <p>Searching for duplicates...</p>}
                    {error && <p className="text-red-400">Error: {error}</p>}
                    {!isLoading && pairs.length === 0 && <p className="text-center text-gray-500 py-8">No potential duplicates found.</p>}
                    <AnimatePresence>
                        {pairs.map((pair) => (
                            <motion.div key={`${pair.entity1.id}-${pair.entity2.id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} className="bg-gray-900/50 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold">{pair.entity1.name}</h4>
                                        <p className="text-xs text-gray-400 font-mono">{pair.entity1.type}</p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{pair.entity1.description}</p>
                                    </div>
                                    <div>
                                         <h4 className="font-semibold">{pair.entity2.name}</h4>
                                        <p className="text-xs text-gray-400 font-mono">{pair.entity2.type}</p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{pair.entity2.description}</p>
                                    </div>
                                </div>
                                <div className="ml-6 flex items-center gap-2">
                                    <span className="text-sm font-semibold text-indigo-300">{(pair.similarity * 100).toFixed(0)}%</span>
                                    <button onClick={() => setMergingPair({ entity1: pair.entity1, entity2: pair.entity2 })} className="px-3 py-1 text-xs bg-yellow-600 rounded-md">Merge</button>
                                    <button onClick={() => handleIgnore(pair)} className="px-3 py-1 text-xs bg-gray-600 rounded-md">Ignore</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </main>
            </motion.div>
             {mergingPair && (
                <MergeConfirmationModal 
                    entitiesToMerge={[mergingPair.entity1, mergingPair.entity2]}
                    onClose={() => setMergingPair(null)}
                    onConfirm={handleConfirmMerge}
                />
            )}
        </motion.div>
    );
};

const MergeConfirmationModal = ({
    onClose,
    onConfirm,
    entitiesToMerge,
} : {
    onClose: () => void;
    onConfirm: (targetId: string, sourceId: string) => void;
    entitiesToMerge: EntityDefinition[];
}) => {
    const [targetId, setTargetId] = useState<string | null>(entitiesToMerge[0]?.id || null);

    const [entityA, entityB] = entitiesToMerge;
    const targetEntity = targetId === entityA.id ? entityA : entityB;
    const sourceEntity = targetId === entityA.id ? entityB : entityA;
    
    const mergedAliases = [...new Set([
        ...(targetEntity.aliases || []), 
        ...(sourceEntity.aliases || []), 
        sourceEntity.name
    ])];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="font-bold text-lg">Confirm Entity Merge</h3>
                    <p className="text-sm text-gray-400 mt-1">Select the canonical (target) entity. The other entity's aliases and relationships will be merged into it, and then it will be deleted.</p>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6">
                    <div className="col-span-1 space-y-4">
                        <h4 className="font-semibold">Select Target</h4>
                        <label className={`block p-3 rounded-lg border-2 cursor-pointer ${targetId === entityA.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700'}`}>
                            <input type="radio" name="target-entity" checked={targetId === entityA.id} onChange={() => setTargetId(entityA.id)} className="mr-2"/>
                            {entityA.name} <span className="text-xs text-gray-500">({entityA.type})</span>
                        </label>
                         <label className={`block p-3 rounded-lg border-2 cursor-pointer ${targetId === entityB.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700'}`}>
                            <input type="radio" name="target-entity" checked={targetId === entityB.id} onChange={() => setTargetId(entityB.id)} className="mr-2"/>
                            {entityB.name} <span className="text-xs text-gray-500">({entityB.type})</span>
                        </label>
                    </div>
                    <div className="col-span-2 bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Merged Result Preview</h4>
                        <div className="text-sm space-y-2">
                            <p><strong>Name:</strong> {targetEntity.name}</p>
                            <p><strong>Type:</strong> {targetEntity.type}</p>
                            <p><strong>Description:</strong> {targetEntity.description}</p>
                             <p><strong>Aliases:</strong></p>
                            <div className="flex flex-wrap gap-1">
                                {mergedAliases.map(alias => <span key={alias} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{alias}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-b-lg flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm">Cancel</button>
                     <button onClick={() => onConfirm(targetEntity.id, sourceEntity.id)} disabled={!targetId} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50">Confirm & Merge</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DuplicateFinderModal;
