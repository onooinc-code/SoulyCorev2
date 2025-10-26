// components/modals/CreateProjectModal.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import { useLog } from '../providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

interface CreateProjectModalProps {
    onClose: () => void;
    onProjectCreated: () => void;
}

const CreateProjectModal = ({ onClose, onProjectCreated }: CreateProjectModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error('Failed to create project');
            addNotification({ type: 'success', title: 'Project Created', message: `Project "${name}" has been successfully created.` });
            onProjectCreated();
            onClose();
        } catch (error) {
            addNotification({ type: 'error', title: 'Error', message: 'Could not create project.' });
            log('Error creating project', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">Create New Project</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400">Project Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" autoFocus />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400">Description (Optional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" rows={3}></textarea>
                    </div>
                </main>
                <footer className="flex justify-end gap-2 p-4 bg-gray-900/50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={handleSubmit} disabled={isLoading || !name.trim()} className="px-4 py-2 text-sm bg-indigo-600 rounded-md disabled:opacity-50">{isLoading ? 'Creating...' : 'Create Project'}</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default CreateProjectModal;
