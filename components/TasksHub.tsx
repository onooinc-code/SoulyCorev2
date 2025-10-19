// components/TasksHub.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import type { Task } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import { useAppContext } from '../providers/AppProvider';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon, XIcon } from '../Icons';

const TaskItem = ({ task, onUpdate, onDelete, onEdit }: { task: Task; onUpdate: (id: string, updates: Partial<Task>) => void; onDelete: (id: string) => void; onEdit: (task: Task) => void; }) => {
    const isCompleted = task.status === 'completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={`group flex items-center gap-4 p-3 rounded-lg transition-colors ${isCompleted ? 'bg-gray-800/50' : 'bg-gray-800 hover:bg-gray-700/50'}`}
        >
            <button 
                onClick={() => onUpdate(task.id, { status: isCompleted ? 'todo' : 'completed' })}
                className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'border-green-500 bg-green-500' : 'border-gray-500 hover:border-indigo-400'}`}
            >
                {isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.title}</p>
                {task.description && <p className={`text-xs truncate ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>{task.description}</p>}
            </div>
            {task.due_date && <span className={`text-xs flex-shrink-0 ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(task.due_date).toLocaleDateString()}</span>}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-blue-400"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
            </div>
        </motion.div>
    );
};


const TasksHub = () => {
    const { log } = useLog();
    const { setStatus, clearError } = useAppContext();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            log('Error fetching tasks', { error }, 'error');
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        const optimisticTask: Partial<Task> = { id: crypto.randomUUID(), title: newTaskTitle, status: 'todo', createdAt: new Date() };
        setTasks(prev => [...prev, optimisticTask as Task]);
        setNewTaskTitle('');

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle }),
            });
            if (!res.ok) throw new Error('Failed to create task');
            await fetchTasks(); // Refresh list with real data
        } catch (error) {
            log('Error adding task', { error }, 'error');
            setStatus({ error: (error as Error).message });
            setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
        }
    };
    
    const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
        const originalTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update task');
            await fetchTasks(); // Refresh to ensure consistency
        } catch (error) {
             log('Error updating task', { error }, 'error');
            setStatus({ error: (error as Error).message });
            setTasks(originalTasks);
        }
    };

    const handleDeleteTask = async (id: string) => {
        const originalTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete task');
        } catch (error) {
            log('Error deleting task', { error }, 'error');
            setStatus({ error: (error as Error).message });
            setTasks(originalTasks);
        }
    };

    const { pendingTasks, completedTasks } = useMemo(() => {
        const pending = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
        const completed = tasks.filter(t => t.status === 'completed');
        return { pendingTasks: pending, completedTasks: completed };
    }, [tasks]);

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Tasks Hub</h2>
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="Add a new task..."
                        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleAddTask} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex-shrink-0"><PlusIcon className="w-5 h-5"/></button>
                </div>
            </header>
            
            <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pt-6">
                <div>
                    <h3 className="font-semibold text-gray-300 mb-3">Pending ({pendingTasks.length})</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                             {pendingTasks.map(task => (
// FIX: Wrapped TaskItem in a div with a key to resolve TypeScript error where the key was being passed down as a prop.
<div key={task.id}>
<TaskItem task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onEdit={() => {}} />
</div>
))}
                        </AnimatePresence>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-300 mb-3">Completed ({completedTasks.length})</h3>
                    <div className="space-y-2">
                         <AnimatePresence>
                            {completedTasks.map(task => (
// FIX: Wrapped TaskItem in a div with a key to resolve TypeScript error where the key was being passed down as a prop.
<div key={task.id}>
<TaskItem task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onEdit={() => {}} />
</div>
))}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TasksHub;