// components/hubs/ExperiencesHub.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Experience } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useAppContext } from '@/components/providers/AppProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeIcon, TrashIcon, XIcon } from '@/components/Icons';
import EmptyState from '../ui/EmptyState';

const ExperiencesHub = () => {
    const { log } = useLog();
    const { setStatus, clearError } = useAppContext();
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

    const fetchExperiences = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/experiences');
            if (!res.ok) throw new Error('Failed to fetch experiences');
            const data = await res.json();
            setExperiences(data);
            log(`Fetched ${data.length} experiences.`);
        } catch (error) {
            log('Error fetching experiences', { error }, 'error');
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this learned experience?")) return;

        try {
            const res = await fetch('/api/experiences', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('Failed to delete experience');
            log('Deleted experience', { id });
            await fetchExperiences();
        } catch (error) {
            log('Error deleting experience', { error }, 'error');
            setStatus({ error: (error as Error).message });
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">Loading experiences...</div>;
    }

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Experiences Hub</h2>
                <p className="text-sm text-gray-400">Viewing synthesized procedural memories (recipes) learned from agent runs.</p>
            </header>

            <main className="flex-1 pt-6 overflow-y-auto">
                {experiences.length === 0 ? (
                    <EmptyState 
                        icon={KnowledgeIcon}
                        title="No Experiences Learned Yet"
                        description="As the autonomous agent completes goals, it will learn reusable recipes from its successes. These learned experiences will appear here."
                    />
                ) : (
                    <div className="space-y-3">
                        {experiences.map(exp => (
                            <motion.div
                                key={exp.id}
                                layout
                                className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50"
                                onClick={() => setSelectedExperience(exp)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-semibold text-indigo-300">{exp.goal_template}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {exp.trigger_keywords?.map(kw => (
                                                <span key={kw} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 ml-4">
                                        <span>Usage: {exp.usage_count}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }} className="p-1 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
            
            <AnimatePresence>
                {selectedExperience && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedExperience(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-2xl border border-indigo-500/50" onClick={e => e.stopPropagation()}>
                             <header className="flex justify-between items-center p-4 border-b border-gray-700"><h3 className="font-bold">Experience Details</h3><button onClick={() => setSelectedExperience(null)}><XIcon className="w-5 h-5"/></button></header>
                             <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <h4 className="font-semibold text-indigo-300">Goal Template</h4>
                                <p className="mb-4">{selectedExperience.goal_template}</p>
                                <h4 className="font-semibold text-indigo-300">Abstracted Steps</h4>
                                 <ul className="list-decimal list-inside space-y-2 mt-2 text-sm">
                                    {(selectedExperience.steps_json as any[])?.map((step: any, index: number) => (
                                        <li key={index}>{step.step_goal}</li>
                                    ))}
                                </ul>
                             </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExperiencesHub;