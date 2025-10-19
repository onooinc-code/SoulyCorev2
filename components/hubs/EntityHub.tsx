
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { EntityDefinition } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
import { useLog } from '@/components/providers/LogProvider';

type EntityFormState = Partial<EntityDefinition> & {
    aliases_str?: string;
};


const EntityHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [entities, setEntities] = useState<EntityDefinition[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [entityForm, setEntityForm] = useState<EntityFormState>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEntities = useCallback(async () => {
        log('Fetching entities for Entity Hub...');
        try {
            const res = await fetch('/api/entities');
            if (!res.ok) throw new Error('Failed to fetch entities');
            const data = await res.json();
            setEntities(data.entities);
            log(`Successfully fetched ${data.entities.length} entities.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch entities.', { error: { message: errorMessage } }, 'error');
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchEntities();
    }, [fetchEntities]);
    
    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!entityForm.name?.trim()) errors.name = "Name is required.";
        if (!entityForm.type?.trim()) errors.type = "Type is required.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleOpenForm = (entity: EntityDefinition | null = null) => {
        if (entity) {
            setEntityForm({
                ...entity,
                aliases_str: Array.isArray(entity.aliases) ? entity.aliases.join(', ') : ''
            });
        } else {
            setEntityForm({ aliases_str: '' });
        }
        setIsFormVisible(true);
    };

    const handleSaveEntity = async () => {
        if (!validateForm()) return;
        
        clearError();
        const isUpdating = !!entityForm.id;
        const url = isUpdating ? `/api/entities/${entityForm.id}` : '/api/entities';
        const method = isUpdating ? 'PUT' : 'POST';

        const payload = {
            ...entityForm,
            aliases: entityForm.aliases_str?.split(',').map(a => a.trim()).filter(Boolean) || []
        };
        delete payload.aliases_str;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} entity`);

            await fetchEntities();
            setIsFormVisible(false);
            setEntityForm({});
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleDeleteEntity = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this entity? This can affect the AI's contextual understanding.")) return;
        try {
            const res = await fetch(`/api/entities/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete entity');
            await fetchEntities();
        } catch (error) {
             setStatus({ error: (error as Error).message });
        }
    };

    const filteredEntities = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        return entities.filter(entity => 
            entity.name.toLowerCase().includes(lowercasedTerm) ||
            entity.type.toLowerCase().includes(lowercasedTerm) ||
            entity.description?.toLowerCase().includes(lowercasedTerm) ||
            (Array.isArray(entity.aliases) && entity.aliases.some(a => a.toLowerCase().includes(lowercasedTerm)))
        );
    }, [entities, searchTerm]);

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Manage Entities</h3>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search entities..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="pl-8 pr-2 py-1.5 bg-gray-700 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenForm()} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm"
                        title="Manually add a new entity to the AI's structured memory."
                    >
                        <PlusIcon className="w-5 h-5" /> Add Entity
                    </button>
                </div>
            </div>
            {isFormVisible && (
                <div className="bg-gray-900/50 p-4 rounded-lg mb-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input value={entityForm.name || ''} onChange={e => setEntityForm({...entityForm, name: e.target.value})} placeholder="Entity Name (e.g., Project Titan)" className={`w-full p-2 bg-gray-700 rounded-lg text-sm ${formErrors.name ? 'border border-red-500' : ''}`}/>
                            {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                            <input value={entityForm.type || ''} onChange={e => setEntityForm({...entityForm, type: e.target.value})} placeholder="Entity Type (e.g., Project)" className={`w-full p-2 bg-gray-700 rounded-lg text-sm ${formErrors.type ? 'border border-red-500' : ''}`}/>
                             {formErrors.type && <p className="text-xs text-red-400 mt-1">{formErrors.type}</p>}
                        </div>
                    </div>
                     <div>
                        <textarea value={entityForm.description || ''} onChange={e => setEntityForm({...entityForm, description: e.target.value})} placeholder='Semantic Description (e.g., "The internal codename for the Q3 marketing initiative.")' className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={2}></textarea>
                    </div>
                     <div>
                        <input value={entityForm.aliases_str || ''} onChange={e => setEntityForm({...entityForm, aliases_str: e.target.value})} placeholder='Aliases (comma-separated, e.g., Titan, Q3 Initiative)' className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSaveEntity} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                        <button onClick={() => { setIsFormVisible(false); setEntityForm({}); setFormErrors({}); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 w-1/3">Description</th>
                            <th className="p-3">Aliases</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntities.map(entity => (
                            <tr key={entity.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-medium">{entity.name}</td>
                                <td className="p-3">{entity.type}</td>
                                <td className="p-3 text-gray-400 text-xs">{entity.description}</td>
                                <td className="p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {Array.isArray(entity.aliases) && entity.aliases.map(alias => (
                                            <span key={alias} className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">{alias}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenForm(entity)} title="Edit this entity's details." className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteEntity(entity.id)} title="Delete this entity." className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredEntities.length === 0 && <p className="text-center text-gray-500 py-8">No entities found.</p>}
            </div>
        </div>
    );
};

export default EntityHub;
