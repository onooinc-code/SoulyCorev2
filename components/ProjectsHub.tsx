"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { PlusIcon, SparklesIcon } from '@/components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SummaryModal = ({ summary, onClose }: { summary: string, onClose: () => void }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">AI Project Summary</h3>
            <div className="prose-custom max-h-96 overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
            <button onClick={onClose} className="mt-4 w-full py-2 bg-indigo-600 rounded-md">Close</button>
        </motion.div>
    </motion.div>
);

const ProjectsHub = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Record<string, ProjectTask[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchProjectsAndTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const projectsRes = await fetch('/api/projects');
            const projectsData: Project[] = await projectsRes.json();
            setProjects(projectsData);

            const tasksData: Record<string, ProjectTask[]> = {};
            for (const project of projectsData) {
                const tasksRes = await fetch(`/api/projects/${project.id}/tasks`);
                tasksData[project.id] = await tasksRes.json();
            }
            setTasks(tasksData);
        } catch (error) {
            log('Error fetching projects/tasks', { error }, 'error');
            addNotification({ type: 'error', title: 'Failed to load projects' });
        } finally {
            setIsLoading(false);
        }
    }, [log, addNotification]);

    useEffect(() => {
        fetchProjectsAndTasks();
    }, [fetchProjectsAndTasks]);

    const handleGenerateSummary = async (projectId: string) => {
        setIsSummaryLoading(true);
        setSummary("Generating summary...");
        try {
            const res = await fetch(`/api/projects/${projectId}/summarize`, { method: 'POST' });
            if (!res.ok) throw new Error("Failed to generate summary");
            const data = await res.json();
            setSummary(data.summary);
        } catch (error) {
            setSummary(`Error: ${(error as Error).message}`);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Projects Hub</h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Project
                </button>
            </header>
            <main className="flex-1 overflow-y-auto pr-2 space-y-4">
                {isLoading ? <p>Loading projects...</p> : projects.map(project => (
                    <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <button onClick={() => handleGenerateSummary(project.id)} disabled={isSummaryLoading} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-xs rounded-md hover:bg-blue-500 disabled:opacity-50">
                                <SparklesIcon className="w-4 h-4" /> AI Summary
                            </button>
                        </div>
                        <p className="text-sm text-gray-400">{project.description}</p>
                        <ul className="mt-2 text-sm">
                            {(tasks[project.id] || []).map(task => (
                                <li key={task.id} className="flex items-center gap-2">
                                    <input type="checkbox" checked={task.status === 'done'} readOnly className="h-4 w-4 rounded-sm bg-gray-700 border-gray-600 text-indigo-600 focus:ring-0" />
                                    <span>{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </main>
            <AnimatePresence>
                {summary && <SummaryModal summary={summary} onClose={() => setSummary(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default ProjectsHub;
