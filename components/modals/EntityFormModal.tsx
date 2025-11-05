"use client";

import React, { useState, useEffect } from 'react';
import { motion }  from 'framer-motion';
import { XIcon, SparklesIcon } from '../Icons';
import type { EntityDefinition } from '@/lib/types';
import { useNotification } from '@/lib/hooks/use-notifications';

interface EntityFormModalProps {
    entity: Partial<EntityDefinition> | null;
    onClose: () => void;
    onSave: (entity: Partial<EntityDefinition>) => void;
}

const EntityFormModal = ({ entity, onClose, onSave }: EntityFormModalProps) => {
    const [formState, setFormState] = useState<Partial<EntityDefinition> & { aliases_str?: string }>({});
    const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
    const { addNotification } = useNotification();

    useEffect(() => {
        if (entity) {
            setFormState({
                ...entity,
                aliases_str: Array.isArray(entity.aliases) ? entity.aliases.join(', ') : '',
            });
        }
    }, [entity]);

    const handleInputChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSuggest = async (type: 'type' | 'aliases') => {
        if (!formState.name) {
            addNotification({ type: 'warning', title: 'Name required for AI suggestions.' });
            return;
        }
        setIsAiLoading(prev => ({ ...prev, [type]: true }));
        try {
            if (type === 'type') {
                const res = await fetch('/api/entities/suggest-type', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formState.name, description: formState.description }),
                });
                if (!res.ok) throw new Error('Failed to suggest type');
                const data = await res.json();
                setFormState(prev => ({ ...prev, type: data.suggestedType }));
            } else if (type === 'aliases') {
                const res = await fetch('/api/entities/suggest-aliases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formState.name, description: formState.description }),
                });
                 if (!res.ok) throw new Error('Failed to suggest aliases');
                const data = await res.json();
                setFormState(prev => ({ ...prev, aliases_str: data.join(', ') }));
            }
        } catch (error) {
            addNotification({ type: 'error', title: 'AI Suggestion Failed', message: (error as Error).message });
        } finally {
            setIsAiLoading(prev => ({ ...prev, [type]: false }));
        }
    };
    
    const handleSaveClick = () => {
        const payload = {
            ...formState,
            aliases: formState.aliases_str?.split(',').map(s => s.trim()).filter(Boolean) || [],
        };
        delete payload.aliases_str;
        onSave(payload);
    };

    if (!entity) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">{formState.id ? 'Edit Entity' : 'Create Entity'}</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400">Name</label>
                        <input type="text" value={formState.name || ''} onChange={e => handleInputChange('name', e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" autoFocus />
                    </div>
                     <div className="relative">
                        <label className="text-sm font-medium text-gray-400">Type</label>
                        <input type="text" value={formState.type || ''} onChange={e => handleInputChange('type', e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" />
                        <button onClick={() => handleSuggest('type')} disabled={isAiLoading['type']} className="absolute right-2 bottom-2 text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                            <SparklesIcon className="w-4 h-4" /> {isAiLoading['type'] ? '...' : 'Suggest'}
                        </button>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400">Description</label>
                        <textarea value={formState.description || ''} onChange={e => handleInputChange('description', e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" rows={3}></textarea>
                    </div>
                     <div className="relative">
                        <label className="text-sm font-medium text-gray-400">Aliases (comma-separated)</label>
                        <input type="text" value={formState.aliases_str || ''} onChange={e => handleInputChange('aliases_str', e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md text-sm" />
                         <button onClick={() => handleSuggest('aliases')} disabled={isAiLoading['aliases']} className="absolute right-2 bottom-2 text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                            <SparklesIcon className="w-4 h-4" /> {isAiLoading['aliases'] ? '...' : 'Suggest'}
                        </button>
                    </div>
                </main>
                <footer className="flex justify-end gap-2 p-4 bg-gray-900/50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 text-sm bg-indigo-600 rounded-md">Save Entity</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default EntityFormModal;
