
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { PlusIcon, TrashIcon } from '@/components/Icons';
import { AnimatePresence, motion } from 'framer-motion';

const TaskItem = ({ task, onUpdate, onDelete }: { task: Task; onUpdate: (task: Task, updates: Partial<Task>) => void; onDelete: (id: string) => void; }) => {
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(task, { status: e.target.checked ? 'completed' : 'todo' });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
        >
            <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={handleStatusChange}
                className="h-5 w-5 rounded-md bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
            />
            <div className="flex-1">
                <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {task.title}
                </p>
                {task.description && <p className="text-xs text-gray-400">{task.description}</p>}
            </div>
            <button onClick={() => onDelete(task.id)} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-4 h-4" />
            </button>
        </motion.div>
    );
};


const TasksHub = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            log('Error fetching tasks', { error }, 'error');
            addNotification({ type: 'error', title: 'Failed to load tasks' });
        } finally {
            setIsLoading(false);
        }
    }, [log, addNotification]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);
    
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        
        const optimisticTask: Task = {
            id: crypto.randomUUID(),
            title: newTaskTitle,
            status: 'todo',
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
        };
        setTasks(prev => [optimisticTask, ...prev]);
        setNewTaskTitle('');

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle }),
            });
            if (!res.ok) throw new Error('Failed to create task');
            await fetchTasks(); // Re-fetch to get the real data
        } catch (error) {
            log('Error creating task', { error }, 'error');
            addNotification({ type: 'error', title: 'Error creating task' });
            setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
        }
    };

    const handleUpdateTask = async (task: Task, updates: Partial<Task>) => {
        const updatedTask = { ...task, ...updates };
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask),
            });
            if (!res.ok) throw new Error('Failed to update task');
        } catch (error) {
            log('Error updating task', { error }, 'error');
            addNotification({ type: 'error', title: 'Error updating task' });
            setTasks(prev => prev.map(t => t.id === task.id ? task : t)); // Revert
        }
    };

    const handleDeleteTask = async (id: string) => {
        const originalTasks = tasks;
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete task');
        } catch (error) {
            log('Error deleting task', { error }, 'error');
            addNotification({ type: 'error', title: 'Error deleting task' });
            setTasks(originalTasks);
        }
    };
    
    const groupedTasks = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const status = task.status;
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(task);
            return acc;
        }, {} as Record<Task['status'], Task[]>);
    }, [tasks]);

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Tasks Hub</h2>
            </header>
            <main className="flex-1 overflow-y-auto pt-6 pr-2 space-y-6">
                <form onSubmit={handleAddTask} className="flex gap-2">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                        <PlusIcon className="w-5 h-5" /> Add Task
                    </button>
                </form>

                {isLoading ? (
                    <p>Loading tasks...</p>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg text-gray-300 mb-2">To-Do</h3>
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {(groupedTasks['todo'] || []).map(task => (
                                        <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                                    ))}
                                    {(groupedTasks['in_progress'] || []).map(task => (
                                        <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                                    ))}
                                </AnimatePresence>
                                {((groupedTasks['todo'] || []).length === 0 && (groupedTasks['in_progress'] || []).length === 0) && <p className="text-sm text-gray-500">No pending tasks.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-300 mb-2">Completed</h3>
                            <div className="space-y-2">
                                <AnimatePresence>
                                {(groupedTasks['completed'] || []).map(task => (
                                    <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                                ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TasksHub;
