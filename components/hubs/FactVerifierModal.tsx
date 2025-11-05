"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, BeakerIcon, CheckIcon, RefreshIcon } from '../Icons';

interface VerifiableFact {
    id: string;
    sourceName: string;
    predicateName: string;
    targetName: string;
    lastVerifiedAt: string | null;
    verificationStatus: string | null;
}

const FactVerifierModal = ({ onClose }: { onClose: () => void }) => {
    const [facts, setFacts] = useState<VerifiableFact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const fetchFacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/entities/verifiable-facts');
            if (!res.ok) throw new Error('Failed to fetch verifiable facts');
            const data = await res.json();
            setFacts(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFacts();
    }, [fetchFacts]);
    
    const handleVerify = async (factId: string) => {
        setVerifyingIds(prev => new Set(prev).add(factId));
        try {
            const res = await fetch('/api/entities/verify-fact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relationshipId: factId }),
            });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || 'Verification failed');
            }
            const updatedFactData = await res.json();
            setFacts(prev => prev.map(f => f.id === factId ? { ...f, ...updatedFactData } : f));
        } catch (err) {
            setError(`Failed to verify fact ${factId}: ${(err as Error).message}`);
        } finally {
            setVerifyingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(factId);
                return newSet;
            });
        }
    };
    
    const statusColors: Record<string, string> = {
        'Verified': 'text-green-400',
        'Refuted': 'text-red-400',
        'Unverified': 'text-yellow-400',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BeakerIcon className="w-5 h-5 text-indigo-400" />
                        Fact Verifier
                    </h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto space-y-3">
                    {isLoading && <p>Loading verifiable facts...</p>}
                    {error && <p className="text-red-400">Error: {error}</p>}
                    {!isLoading && facts.length === 0 && <p className="text-center text-gray-500 py-8">No facts currently require verification.</p>}
                    <AnimatePresence>
                        {facts.map((fact) => (
                            <motion.div key={fact.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex-1 font-mono text-sm">
                                    <span className="text-blue-400">{fact.sourceName}</span>
                                    <span className="text-gray-400"> --[{fact.predicateName.replace(/_/g, ' ')}]--> </span>
                                    <span className="text-green-400">{fact.targetName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {fact.verificationStatus ? (
                                        <span className={`text-xs font-bold ${statusColors[fact.verificationStatus] || 'text-gray-400'}`}>
                                            {fact.verificationStatus}
                                        </span>
                                    ) : (
                                         <span className="text-xs text-gray-500">Not Verified</span>
                                    )}
                                    <button onClick={() => handleVerify(fact.id)} disabled={verifyingIds.has(fact.id)} className="px-3 py-1 text-xs bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50">
                                        {verifyingIds.has(fact.id) ? 'Verifying...' : 'Verify'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </main>
            </motion.div>
        </motion.div>
    );
};

export default FactVerifierModal;
