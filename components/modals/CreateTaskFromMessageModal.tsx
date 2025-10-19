// components/modals/CreateTaskFromMessageModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../Icons';
import type { Project, Message } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

interface CreateTaskFromMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: Message | null;
}

const CreateTaskFromMessageModal = ({ isOpen, onClose, message }: CreateTaskFromMessageModalProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { log } = useLog();
    const { addNotification } = useNotification();

    useEffect(() => {
        if (isOpen) {
            const fetchProjects = async () => {
                try {
                    const res = await fetch('/api/projects');
                    if (!res.ok) throw new Error("Failed to fetch projects");
                    const data = await res.json();
                    setProjects(data);
                    if (data.length > 0) {
                        setSelectedProjectId(data[0].id);
                    }
                } catch (error) {
                    log('Error fetching projects for task modal', { error }, 'error');
                }
            };
            fetchProjects();

            if (message) {
                // Pre-fill form with message content
                const lines = message.content.split('\n');
                setTitle(lines[0]);
                setDescription(lines.slice(1).join('\n'));
            }
        }
    }, [isOpen, message, log]);

    const handleSubmit = async () => {
        if (!title.trim() || !selectedProjectId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });
            if (!res.ok) throw new Error('Failed to create task');
            addNotification({ type: 'success', title: 'Task Created', message: `Task "${title}" added to project.` });
            onClose();
        } catch (error) {
            addNotification({ type: 'error', title: 'Error', message: 'Could not create task.' });
            log('Error creating task from message', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && message && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <header className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-lg font-bold">Create Task from Message</h2>
                            <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                        </header>
                        <main className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400">Project</label>
                                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm">
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-400">Task Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" rows={4}></textarea>
                            </div>
                        </main>
                        <footer className="flex justify-end gap-2 p-4 bg-gray-900/50 rounded-b-lg">
                            <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 rounded-md">Cancel</button>
                            <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 text-sm bg-indigo-600 rounded-md disabled:opacity-50">{isLoading ? 'Creating...' : 'Create Task'}</button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateTaskFromMessageModal;
