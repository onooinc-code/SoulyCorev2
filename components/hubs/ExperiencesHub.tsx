
"use client";

// components/hubs/ExperiencesHub.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { Experience } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainIcon, TrashIcon } from '@/components/Icons';

const ExperienceCard = ({ experience, onDelete }: { experience: Experience, onDelete: (id: string) => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 p-4 rounded-lg"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-indigo-300">{experience.goal_template}</h4>
                    <p className="text-xs text-gray-500 mt-1">Source Run ID: {experience.source_run_id}</p>
                </div>
                <button onClick={() => onDelete(experience.id)} className="p-1 text-gray-500 hover:text-red-400">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 mb-1">Trigger Keywords:</p>
                <div className="flex flex-wrap gap-1">
                    {experience.trigger_keywords.map(kw => <span key={kw} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{kw}</span>)}
                </div>
            </div>
            <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-gray-400">View Abstract Plan</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-900/50 rounded-md"><code>{JSON.stringify(experience.steps_json, null, 2)}</code></pre>
            </details>
        </motion.div>
    )
}

const ExperiencesHub = () => {
    const { log } = useLog();
    const { addNotification } = useNotification();
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchExperiences = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/experiences');
            if (!res.ok) throw new Error("Failed to fetch experiences");
            const data = await res.json();
            setExperiences(data);
        } catch (error) {
            log('Error fetching experiences', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this learned experience? The agent will no longer be able to use it as a reference.")) return;
        try {
             const res = await fetch(`/api/experiences/${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Failed to delete experience");
             addNotification({ type: 'success', title: 'Experience Deleted' });
             await fetchExperiences();
        } catch (error) {
             log('Error deleting experience', { error, id }, 'error');
             addNotification({ type: 'error', title: 'Error', message: (error as Error).message });
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Experiences Hub</h2>
                <p className="text-sm text-gray-400 mt-1">A repository of generalized plans learned from successful agent runs.</p>
            </header>
            
            <main className="flex-1 overflow-y-auto pt-6 pr-2 space-y-4">
                {isLoading ? <p>Loading experiences...</p> : experiences.length > 0 ? (
                    <AnimatePresence>
                        {experiences.map(exp => (
                            <ExperienceCard key={exp.id} experience={exp} onDelete={handleDelete} />
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center text-gray-500 py-16">
                        <BrainIcon className="w-12 h-12 mx-auto mb-4"/>
                        <h3 className="font-semibold text-lg">No Experiences Learned Yet</h3>
                        <p className="text-sm">Successful agent runs will generate experiences here automatically.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ExperiencesHub;
