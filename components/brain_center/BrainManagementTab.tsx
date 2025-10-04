

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Brain } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon } from '../Icons';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from '../providers/LogProvider';

const BrainManagementTab = () => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [brains, setBrains] = useState<Brain[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentBrain, setCurrentBrain] = useState<(Omit<Partial<Brain>, 'config_json'> & { config_json: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const fetchBrains = useCallback(async () => {
        setIsLoading(true);
        clearError();
        log('Fetching all brains...');
        try {
            const res = await fetch('/api/brains');
            if (!res.ok) throw new Error('Failed to fetch brains');
            const data = await res.json();
            setBrains(data);
            log(`Successfully fetched ${data.length} brains.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch brains.', { error: { message: errorMessage } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchBrains();
    }, [fetchBrains]);

    const handleOpenForm = (brain: Brain | null = null) => {
        const action = brain ? 'edit' : 'new';
        log(`User opened brain form for ${action} brain.`, { brainId: brain?.id });
        
        let brainForForm: Omit<Partial<Brain>, 'config_json'> & { config_json: string };
        if (brain) {
            brainForForm = {
                ...brain,
                config_json: JSON.stringify(brain.config_json, null, 2)
            };
        } else {
            brainForForm = {
                name: '',
                config_json: JSON.stringify({
                    "episodic": "default_episodic",
                    "semantic": "default_semantic",
                    "structured": "default_structured"
                }, null, 2)
            };
        }
        setCurrentBrain(brainForForm);
        setJsonError(null);
        setIsFormOpen(true);
    };

    const handleSaveBrain = async () => {
        if (!currentBrain || !currentBrain.name) return;
        
        let parsedConfig;
        try {
            parsedConfig = JSON.parse(currentBrain.config_json);
            setJsonError(null);
        } catch (e) {
            setJsonError('Invalid JSON format in configuration.');
            log('Brain save failed due to invalid JSON.', { error: (e as Error).message }, 'error');
            return;
        }

        clearError();
        const isUpdating = !!currentBrain.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} brain...`, { brainData: { ...currentBrain, config_json: 'OMITTED' } });

        const url = isUpdating ? `/api/brains/${currentBrain.id}` : '/api/brains';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: currentBrain.name, config_json: parsedConfig }),
            });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || `Failed to ${isUpdating ? 'update' : 'create'} brain`);
            }
            
            await fetchBrains();
            setIsFormOpen(false);
            setCurrentBrain(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} brain.`, { error: { message: errorMessage } }, 'error');
        }
    };
    
    const handleDeleteBrain = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this brain? This action cannot be undone.')) {
            clearError();
            log(`Attempting to delete brain with ID: ${id}`);
            try {
                const res = await fetch(`/api/brains/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete brain');
                log('Brain deleted successfully.', { id });
                await fetchBrains();
            } catch (error) {
                 const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete brain.', { id, error: { message: errorMessage } }, 'error');
            }
        }
    };

    const renderForm = () => (
        <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-4">
            <h3 className="font-semibold text-lg">{currentBrain?.id ? 'Edit Brain' : 'New Brain'}</h3>
            <div>
                <label htmlFor="brainName" className="block text-sm font-medium text-gray-400 mb-1">Brain Name</label>
                <input 
                    id="brainName"
                    value={currentBrain?.name || ''} 
                    onChange={e => setCurrentBrain(b => b ? {...b, name: e.target.value} : null)} 
                    placeholder="e.g., 'Work Brain'" 
                    className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                />
            </div>
            <div>
                 <label htmlFor="brainConfig" className="block text-sm font-medium text-gray-400 mb-1">Configuration (JSON)</label>
                 <p className="text-xs text-gray-500 mb-2">Defines the namespaces for each memory module to ensure data isolation.</p>
                 <textarea 
                    id="brainConfig"
                    value={currentBrain?.config_json || ''} 
                    onChange={e => setCurrentBrain(b => b ? {...b, config_json: e.target.value} : null)}
                    placeholder='{ "episodic": "work_episodes", "semantic": "work_knowledge" }' 
                    className={`w-full p-2 bg-gray-700 rounded-lg text-sm font-mono ${jsonError ? 'border border-red-500' : ''}`}
                    rows={6}
                ></textarea>
                {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
            </div>
            <div className="flex gap-2">
                <button onClick={handleSaveBrain} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Brain</button>
                <button onClick={() => { setIsFormOpen(false); setCurrentBrain(null); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h3 className="text-2xl font-bold">Brain Management</h3>
                 <button 
                    onClick={() => handleOpenForm()} 
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm"
                    title="Define a new AI Agent Brain."
                 >
                        <PlusIcon className="w-5 h-5" /> Add New Brain
                 </button>
            </div>

            <AnimatePresence>
                {isFormOpen && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0">
                        {renderForm()}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="flex-1 overflow-y-auto pr-2">
                 {isLoading ? (
                    <div className="flex-1 flex items-center justify-center"><p>Loading brains...</p></div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Configuration</th>
                                <th className="p-3">Created At</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brains.map(brain => (
                                <tr key={brain.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium">{brain.name}</td>
                                    <td className="p-3">
                                        <details className="text-xs">
                                            <summary className="cursor-pointer">View JSON</summary>
                                            <pre className="mt-2 p-2 bg-gray-800 rounded-md"><code>{JSON.stringify(brain.config_json, null, 2)}</code></pre>
                                        </details>
                                    </td>
                                    <td className="p-3">{new Date(brain.createdAt).toLocaleString()}</td>
                                    <td className="p-3">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleOpenForm(brain)} title="Edit this brain's configuration."><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                            <button onClick={() => handleDeleteBrain(brain.id)} title="Permanently delete this brain."><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && brains.length === 0 && (
                     <div className="text-center py-8 text-gray-500">
                        <p>No brains found. Add one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrainManagementTab;
