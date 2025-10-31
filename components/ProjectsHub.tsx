"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { PlusIcon, SparklesIcon, PlusCircleIcon, TrashIcon } from '@/components/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const SummaryModal = dynamic(() => import('./modals/SummaryModal'));
const CreateProjectModal = dynamic(() => import('./modals/CreateProjectModal'));
const CreateTaskModal = dynamic(() => import('./modals/CreateTaskModal'));

const ProjectsHub = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Record<string, ProjectTask[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [summaryState, setSummaryState] = useState<{ isOpen: boolean; text: string; isLoading: boolean, title: string }>({ isOpen: false, text: '', isLoading: false, title: '' });
    
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [currentProjectIdForTask, setCurrentProjectIdForTask] = useState<string | null>(null);

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

    const handleGenerateSummary = async (projectId: string, projectName: string) => {
        setSummaryState({ isOpen: true, text: '', isLoading: true, title: `AI Summary for ${projectName}` });
        try {
            const res = await fetch(`/api/projects/${projectId}/summarize`, { method: 'POST' });
            if (!res.ok) throw new Error("Failed to generate summary");
            const data = await res.json();
            setSummaryState(prev => ({ ...prev, text: data.summary, isLoading: false }));
        } catch (error) {
            setSummaryState(prev => ({ ...prev, text: `Error: ${(error as Error).message}`, isLoading: false }));
        }
    };
    
    const handleOpenTaskModal = (projectId: string) => {
        setCurrentProjectIdForTask(projectId);
        setIsTaskModalOpen(true);
    };
    
    const handleTaskStatusToggle = async (task: ProjectTask) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        
        // Optimistic update
        setTasks(prev => ({
            ...prev,
            // FIX: Corrected property name from `project_id` to `projectId`.
            [task.projectId]: prev[task.projectId].map(t => t.id === task.id ? {...t, status: newStatus} : t)
        }));

        try {
            // FIX: Corrected property name from `project_id` to `projectId`.
            const res = await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update task status");
            // No need to re-fetch on success due to optimistic update
        } catch(error) {
            addNotification({ type: 'error', title: 'Update Failed', message: (error as Error).message });
            // Revert optimistic update
            setTasks(prev => ({
                ...prev,
                // FIX: Corrected property name from `project_id` to `projectId`.
                [task.projectId]: prev[task.projectId].map(t => t.id === task.id ? {...t, status: task.status} : t)
            }));
        }
    };

    const handleDeleteTask = async (task: ProjectTask) => {
        if (!window.confirm(`Are you sure you want to delete the task "${task.title}"?`)) return;
        
        const originalTasks = { ...tasks };
        // Optimistic update
        setTasks(prev => ({
            ...prev,
            // FIX: Corrected property name from `project_id` to `projectId`.
            [task.projectId]: prev[task.projectId].filter(t => t.id !== task.id)
        }));
        
        try {
             // FIX: Corrected property name from `project_id` to `projectId`.
             const res = await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Failed to delete task");
             addNotification({ type: 'success', title: 'Task Deleted' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Delete Failed', message: (error as Error).message });
            // Revert
            setTasks(originalTasks);
        }
    };


    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Projects Hub</h2>
                <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Project
                </button>
            </header>
            <main className="flex-1 overflow-y-auto pr-2 space-y-4">
                {isLoading ? <p>Loading projects...</p> : projects.map(project => (
                    <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{project.name}</h3>
                                <p className="text-sm text-gray-400">{project.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleGenerateSummary(project.id, project.name)} disabled={summaryState.isLoading} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-xs rounded-md hover:bg-blue-500 disabled:opacity-50">
                                    <SparklesIcon className="w-4 h-4" /> AI Summary
                                </button>
                                <button onClick={() => handleOpenTaskModal(project.id)} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-xs rounded-md hover:bg-green-500">
                                    <PlusCircleIcon className="w-4 h-4" /> Add Task
                                </button>
                            </div>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm">
                            {(tasks[project.id] || []).map(task => (
                                <li key={task.id} className="group flex items-center gap-2 p-1 rounded-md hover:bg-gray-700/50">
                                    <input type="checkbox" checked={task.status === 'done'} onChange={() => handleTaskStatusToggle(task)} className="h-4 w-4 rounded-sm bg-gray-700 border-gray-600 text-indigo-600 focus:ring-0 cursor-pointer" />
                                    <span className={`flex-1 ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
                                    <button onClick={() => handleDeleteTask(task)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </main>
            <AnimatePresence>
                {summaryState.isOpen && <SummaryModal title={summaryState.title} summaryText={summaryState.text} isLoading={summaryState.isLoading} onClose={() => setSummaryState({ isOpen: false, text: '', isLoading: false, title: '' })} />}
            </AnimatePresence>
            <AnimatePresence>
                {isProjectModalOpen && <CreateProjectModal onClose={() => setIsProjectModalOpen(false)} onProjectCreated={fetchProjectsAndTasks} />}
            </AnimatePresence>
             <AnimatePresence>
                {isTaskModalOpen && currentProjectIdForTask && <CreateTaskModal projectId={currentProjectIdForTask} onClose={() => setIsTaskModalOpen(false)} onTaskCreated={fetchProjectsAndTasks} />}
            </AnimatePresence>
        </div>
    );
};

export default ProjectsHub;