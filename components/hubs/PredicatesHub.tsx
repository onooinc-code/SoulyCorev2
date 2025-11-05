"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { PredicateDefinition } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon } from '@/components/Icons';
import { useLog } from '@/components/providers/LogProvider';

const PredicatesHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [predicates, setPredicates] = useState<PredicateDefinition[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formState, setFormState] = useState<Partial<PredicateDefinition>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const fetchPredicates = useCallback(async () => {
        log('Fetching predicates...');
        try {
            const res = await fetch('/api/predicates');
            if (!res.ok) throw new Error('Failed to fetch predicates');
            const data = await res.json();
            setPredicates(data);
            log(`Successfully fetched ${data.length} predicates.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch predicates.', { error: { message: errorMessage } }, 'error');
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchPredicates();
    }, [fetchPredicates]);
    
    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formState.name?.trim()) errors.name = "Name is required.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleOpenForm = (predicate: PredicateDefinition | null = null) => {
        setFormState(predicate || {});
        setIsFormVisible(true);
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        clearError();
        const isUpdating = !!formState.id;
        const url = isUpdating ? `/api/predicates/${formState.id}` : '/api/predicates';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} predicate`);

            await fetchPredicates();
            setIsFormVisible(false);
            setFormState({});
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this predicate? This may affect existing relationships.")) return;
        try {
            const res = await fetch(`/api/predicates/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete predicate');
            await fetchPredicates();
        } catch (error) {
             setStatus({ error: (error as Error).message });
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Manage Predicates</h3>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Predicate
                </button>
            </div>
            {isFormVisible && (
                <div className="bg-gray-900/50 p-4 rounded-lg mb-4 space-y-3">
                    <div>
                        <input value={formState.name || ''} onChange={e => setFormState({...formState, name: e.target.value})} placeholder="Predicate Name (e.g., works_for)" className={`w-full p-2 bg-gray-700 rounded-lg text-sm font-mono ${formErrors.name ? 'border border-red-500' : ''}`}/>
                        {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                    </div>
                     <div>
                        <textarea value={formState.description || ''} onChange={e => setFormState({...formState, description: e.target.value})} placeholder='Description' className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={2}></textarea>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                        <button onClick={() => { setIsFormVisible(false); setFormState({}); setFormErrors({}); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {predicates.map(predicate => (
                            <tr key={predicate.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-medium font-mono">{predicate.name}</td>
                                <td className="p-3 text-gray-400 text-xs">{predicate.description}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenForm(predicate)} title="Edit" className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(predicate.id)} title="Delete" className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {predicates.length === 0 && <p className="text-center text-gray-500 py-8">No predicates found. Add one to define relationship types.</p>}
            </div>
        </div>
    );
};

export default PredicatesHub;
