

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon, XIcon, CheckIcon } from './Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useLog } from './providers/LogProvider';

type TaskStatus = 'pending' | 'completed';

const TaskItem = ({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void; }) => {
    const isCompleted = task.status === 'completed';
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-4 p-3 rounded-lg group ${isCompleted ? 'bg-gray-800/50' : 'bg-gray-800'}`}
        >
            <button onClick={onToggle} className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400'}`}>
                    {isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
                </div>
            </button>
            <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-gray-400 truncate">{task.description}</p>}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-400"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </motion.div>
    );
};


const TasksHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        clearError();
        log('Fetching tasks...');
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error('Failed to fetch tasks');
            const data = await res.json();
            setTasks(data);
            log(`Successfully fetched ${data.length} tasks.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch tasks.', { error: { message: errorMessage } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleOpenForm = (task: Partial<Task> | null = null) => {
        const action = task ? 'edit' : 'new';
        log(`User opened task form for ${action} task.`, { taskId: task?.id });
        setCurrentTask(task || {});
        setIsFormOpen(true);
    };

    const handleSaveTask = async () => {
        if (!currentTask || !currentTask.title) return;
        clearError();
        const isUpdating = !!currentTask.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} task...`, { taskData: currentTask });

        const url = isUpdating ? `/api/tasks/${currentTask.id}` : '/api/tasks';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTask),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} task`);
            
            await fetchTasks();
            setIsFormOpen(false);
            setCurrentTask(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} task.`, { error: { message: errorMessage } }, 'error');
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            clearError();
            log(`Attempting to delete task with ID: ${id}`);
            try {
                const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete task');
                log('Task deleted successfully.', { id });
                await fetchTasks();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete task.', { id, error: { message: errorMessage } }, 'error');
            }
        }
    };

    const handleToggleStatus = async (task: Task) => {
        const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
        log(`Toggling task status`, { taskId: task.id, newStatus });
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update task status');
            await fetchTasks();
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to toggle task status.', { error: { message: errorMessage } }, 'error');
        }
    };

    const { pendingTasks, completedTasks } = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (task.status === 'completed') {
                acc.completedTasks.push(task);
            } else {
                acc.pendingTasks.push(task);
            }
            return acc;
        }, { pendingTasks: [] as Task[], completedTasks: [] as Task[] });
    }, [tasks]);

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Tasks Hub</h2>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Task
                </button>
            </div>
            
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex-shrink-0"
                    >
                         <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
                            <h3 className="font-semibold text-lg">{currentTask?.id ? 'Edit Task' : 'New Task'}</h3>
                            <input value={currentTask?.title || ''} onChange={e => setCurrentTask(t => t ? {...t, title: e.target.value} : null)} placeholder="Task Title (e.g., 'Draft project proposal')" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <textarea value={currentTask?.description || ''} onChange={e => setCurrentTask(t => t ? {...t, description: e.target.value} : null)} placeholder="Description (Optional)" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={2}></textarea>
                             <input type="date" value={currentTask?.due_date ? new Date(currentTask.due_date).toISOString().split('T')[0] : ''} onChange={e => setCurrentTask(t => t ? {...t, due_date: e.target.value ? new Date(e.target.value) : null} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                            <div className="flex gap-2">
                                <button onClick={handleSaveTask} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                                <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading tasks...</div>
                ) : (
                    <>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Pending ({pendingTasks.length})</h3>
                        <div className="space-y-2">
                            {/* FIX: Wrap TaskItem in a div with the key prop to resolve TypeScript error. */}
                            {pendingTasks.map(task => (
                                <div key={task.id}>
                                    <TaskItem task={task} onToggle={() => handleToggleStatus(task)} onEdit={() => handleOpenForm(task)} onDelete={() => handleDeleteTask(task.id)} />
                                </div>
                            ))}
                        </div>
                        
                        {completedTasks.length > 0 && (
                            <>
                                <h3 className="text-sm font-semibold text-gray-400 mt-6 mb-2">Completed ({completedTasks.length})</h3>
                                <div className="space-y-2">
                                    {/* FIX: Wrap TaskItem in a div with the key prop to resolve TypeScript error. */}
                                    {completedTasks.map(task => (
                                        <div key={task.id}>
                                            <TaskItem task={task} onToggle={() => handleToggleStatus(task)} onEdit={() => handleOpenForm(task)} onDelete={() => handleDeleteTask(task.id)} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TasksHub;