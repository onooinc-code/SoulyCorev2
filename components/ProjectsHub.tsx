// components/ProjectsHub.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Project, ProjectTask } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useAppContext } from '@/components/providers/AppProvider';
import { PlusIcon, TrashIcon, EditIcon } from '@/components/Icons';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import EmptyState from './ui/EmptyState';
import { ClipboardDocumentListIcon } from './Icons';

type TaskStatus = 'todo' | 'in_progress' | 'done';

const statusMap: Record<TaskStatus, { title: string; color: string }> = {
    todo: { title: 'To Do', color: 'border-gray-500' },
    in_progress: { title: 'In Progress', color: 'border-blue-500' },
    done: { title: 'Done', color: 'border-green-500' },
};


const TaskCard = ({ task, onEdit, onDelete }: { task: ProjectTask; onEdit: () => void; onDelete: () => void; }) => (
    <div className="bg-gray-700/50 p-3 rounded-md group">
        <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-200">{task.title}</p>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-400"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
        {task.description && <p className="text-xs text-gray-400 mt-1">{task.description}</p>}
    </div>
);


const ProjectsHub = () => {
    const { log } = useLog();
    const { setStatus, clearError } = useAppContext();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error('Failed to fetch projects');
            const data = await res.json();
            setProjects(data);
            if (data.length > 0 && !selectedProject) {
                setSelectedProject(data[0]);
            }
        } catch (error) {
            log('Error fetching projects', { error }, 'error');
            setStatus({ error: (error as Error).message });
        }
    }, [log, setStatus, selectedProject]);

    const fetchTasks = useCallback(async (projectId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/tasks`);
            if (!res.ok) throw new Error('Failed to fetch tasks');
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            log('Error fetching tasks', { error }, 'error');
            setStatus({ error: (error as Error).message });
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (selectedProject) {
            fetchTasks(selectedProject.id);
        } else {
            setTasks([]);
        }
    }, [selectedProject, fetchTasks]);

    const tasksByStatus = useMemo(() => {
        return tasks.reduce((acc, task) => {
            (acc[task.status] = acc[task.status] || []).push(task);
            return acc;
        }, {} as Record<TaskStatus, ProjectTask[]>);
    }, [tasks]);

    const onReorder = async (status: TaskStatus, reorderedTasks: ProjectTask[]) => {
        const originalTasks = [...tasks];
        
        // Optimistic update
        setTasks(prev => {
            const otherTasks = prev.filter(t => t.status !== status);
            const updatedOrder = reorderedTasks.map((task, index) => ({...task, order_index: index}));
            return [...otherTasks, ...updatedOrder].sort((a,b) => a.order_index - b.order_index);
        });

        // Backend update
        try {
            for (const [index, task] of reorderedTasks.entries()) {
                if(task.order_index !== index) {
                     await fetch(`/api/tasks/${task.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_index: index }),
                    });
                }
            }
        } catch(error) {
            log('Failed to reorder tasks', { error }, 'error');
            setStatus({error: 'Failed to save new task order.'});
            setTasks(originalTasks); // Revert on failure
        }
    };
    
    // Add other handlers (add, update, delete task/project) here...

    return (
        <div className="w-full h-full flex p-6 bg-gray-900">
            {/* Project List Sidebar */}
            <aside className="w-1/4 h-full flex flex-col bg-gray-800/50 rounded-lg p-3 mr-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Projects</h3>
                    <button className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500"><PlusIcon className="w-5 h-5"/></button>
                </div>
                <div className="overflow-y-auto space-y-2">
                    {projects.map(p => (
                        <button key={p.id} onClick={() => setSelectedProject(p)} className={`w-full text-left p-2 rounded-md ${selectedProject?.id === p.id ? 'bg-indigo-900/50' : 'hover:bg-gray-700/50'}`}>
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.status}</p>
                        </button>
                    ))}
                </div>
            </aside>
            
            {/* Main Kanban Board */}
            <main className="w-3/4 h-full flex flex-col">
                {selectedProject ? (
                    <>
                        <header className="mb-4">
                            <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                            <p className="text-sm text-gray-400">{selectedProject.description}</p>
                        </header>
                        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => (
                                <div key={status} className="flex flex-col bg-gray-800/50 rounded-lg p-3">
                                    <h4 className={`font-semibold mb-3 pb-2 border-b-2 ${statusMap[status].color}`}>{statusMap[status].title}</h4>
                                    <Reorder.Group 
                                        axis="y"
                                        values={tasksByStatus[status] || []}
                                        onReorder={(newOrder) => onReorder(status, newOrder)}
                                        className="space-y-3 overflow-y-auto"
                                    >
                                        {(tasksByStatus[status] || []).map(task => (
                                            <Reorder.Item key={task.id} value={task}>
                                                <TaskCard task={task} onEdit={() => {}} onDelete={() => {}} />
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState 
                        icon={ClipboardDocumentListIcon}
                        title="No Project Selected"
                        description="Select a project from the left panel to view its tasks."
                    />
                )}
            </main>
        </div>
    );
};

export default ProjectsHub;
