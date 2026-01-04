
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { PlusIcon, SparklesIcon, PlusCircleIcon, TrashIcon, DocumentTextIcon } from '@/components/Icons';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const SummaryModal = dynamic(() => import('./modals/SummaryModal'), { ssr: false });
const CreateProjectModal = dynamic(() => import('./modals/CreateProjectModal'), { ssr: false });
const CreateTaskModal = dynamic(() => import('./modals/CreateTaskModal'), { ssr: false });
const ProjectContextModal = dynamic(() => import('./modals/ProjectContextModal'), { ssr: false });

const ProjectsHub = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Record<string, ProjectTask[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [summaryState, setSummaryState] = useState<{ isOpen: boolean; text: string; isLoading: boolean, title: string }>({ isOpen: false, text: '', isLoading: false, title: '' });
    
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentProjectName, setCurrentProjectName] = useState<string>('');

    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchProjectsAndTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const projectsRes = await fetch('/api/projects');
            if (!projectsRes.ok) throw new Error("Failed to fetch projects");
            
            const projectsData = await projectsRes.json();
            
            // Check if projectsData is actually an array
            if (!Array.isArray(projectsData)) {
                console.error("Projects API returned invalid data:", projectsData);
                setProjects([]);
                return;
            }
            setProjects(projectsData);

            const tasksData: Record<string, ProjectTask[]> = {};
            for (const project of projectsData) {
                try {
                    const tasksRes = await fetch(`/api/projects/${project.id}/tasks`);
                    if (tasksRes.ok) {
                        const tData = await tasksRes.json();
                        // Strictly validate that tData is an array before assigning
                        tasksData[project.id] = Array.isArray(tData) ? tData : [];
                    } else {
                        tasksData[project.id] = [];
                    }
                } catch (e) {
                    console.error(`Failed to fetch tasks for project ${project.id}`, e);
                    tasksData[project.id] = [];
                }
            }
            setTasks(tasksData);
        } catch (error) {
            log('Error fetching projects/tasks', { error }, 'error');
            addNotification({ type: 'error', title: 'Failed to load projects' });
            setProjects([]); // Fallback to empty to prevent UI crash
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
        setCurrentProjectId(projectId);
        setIsTaskModalOpen(true);
    };

    const handleOpenContextModal = (projectId: string, projectName: string) => {
        setCurrentProjectId(projectId);
        setCurrentProjectName(projectName);
        setIsContextModalOpen(true);
    };
    
    const handleTaskStatusToggle = async (task: ProjectTask) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        setTasks(prev => {
            const projectTasks = prev[task.projectId] || [];
            if (!Array.isArray(projectTasks)) return prev; // Safety check
            
            return {
                ...prev,
                [task.projectId]: projectTasks.map(t => t.id === task.id ? {...t, status: newStatus} : t)
            };
        });

        try {
            const res = await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update task status");
        } catch(error) {
            addNotification({ type: 'error', title: 'Update Failed', message: (error as Error).message });
            // Revert state on error
            setTasks(prev => {
                const projectTasks = prev[task.projectId] || [];
                if (!Array.isArray(projectTasks)) return prev;
                return {
                    ...prev,
                    [task.projectId]: projectTasks.map(t => t.id === task.id ? {...t, status: task.status} : t)
                };
            });
        }
    };

    const handleDeleteTask = async (task: ProjectTask) => {
        if (!window.confirm(`Are you sure you want to delete the task "${task.title}"?`)) return;
        const originalTasks = { ...tasks };
        
        setTasks(prev => {
             const projectTasks = prev[task.projectId] || [];
             if (!Array.isArray(projectTasks)) return prev;
             return {
                ...prev,
                [task.projectId]: projectTasks.filter(t => t.id !== task.id)
            };
        });
        
        try {
             const res = await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Failed to delete task");
             addNotification({ type: 'success', title: 'Task Deleted' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Delete Failed', message: (error as Error).message });
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
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No projects found. Create one to get started.</div>
                ) : (
                    projects.map(project => (
                    <div key={project.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{project.name}</h3>
                                <p className="text-sm text-gray-400">{project.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenContextModal(project.id, project.name)} className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-xs rounded-md hover:bg-gray-600 text-indigo-300 border border-indigo-500/30 transition-colors" title="Inject Code/Business Logic">
                                    <DocumentTextIcon className="w-3.5 h-3.5" /> Technical Context
                                </button>
                                <button onClick={() => handleGenerateSummary(project.id, project.name)} disabled={summaryState.isLoading} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-xs rounded-md hover:bg-blue-500 disabled:opacity-50">
                                    <SparklesIcon className="w-3.5 h-3.5" /> AI Summary
                                </button>
                                <button onClick={() => handleOpenTaskModal(project.id)} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-xs rounded-md hover:bg-green-500">
                                    <PlusCircleIcon className="w-3.5 h-3.5" /> Add Task
                                </button>
                            </div>
                        </div>
                        {/* Defensive rendering: Check Array.isArray explicitly inside JSX */}
                        <ul className="mt-4 space-y-2 text-sm">
                            {(Array.isArray(tasks[project.id]) ? tasks[project.id] : []).map(task => (
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
                )))}
            </main>
            <AnimatePresence>
                {summaryState.isOpen && <SummaryModal title={summaryState.title} summaryText={summaryState.text} isLoading={summaryState.isLoading} onClose={() => setSummaryState({ isOpen: false, text: '', isLoading: false, title: '' })} />}
            </AnimatePresence>
            <AnimatePresence>
                {isProjectModalOpen && <CreateProjectModal onClose={() => setIsProjectModalOpen(false)} onProjectCreated={fetchProjectsAndTasks} />}
            </AnimatePresence>
             <AnimatePresence>
                {isTaskModalOpen && currentProjectId && <CreateTaskModal projectId={currentProjectId} onClose={() => setIsTaskModalOpen(false)} onTaskCreated={fetchProjectsAndTasks} />}
            </AnimatePresence>
            <AnimatePresence>
                {isContextModalOpen && currentProjectId && <ProjectContextModal projectId={currentProjectId} projectName={currentProjectName} onClose={() => setIsContextModalOpen(false)} />}
            </AnimatePresence>
        </div>
    );
};

export default ProjectsHub;
