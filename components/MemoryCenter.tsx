
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Entity, Tool } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
// FIX: Corrected relative import paths for icon components and the `useLog` hook to use the absolute path alias `@`, resolving module resolution errors during the build process.
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
// FIX: Corrected relative import paths for icon components and the `useLog` hook to use the absolute path alias `@`, resolving module resolution errors during the build process.
import { useLog } from '@/components/providers/LogProvider';

type Tab = 'structured' | 'procedural' | 'settings';

const MemoryCenter = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [activeTab, setActiveTab] = useState<Tab>('structured');
    const [entities, setEntities] = useState<Entity[]>([]);
    const [tools, setTools] = useState<Tool[]>([]); // Placeholder
    const [stats, setStats] = useState({ entities: 0, knowledge: 0 });
    
    const [entityForm, setEntityForm] = useState<Partial<Entity>>({});
    const [isEntityFormVisible, setIsEntityFormVisible] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEntities = useCallback(async () => {
        log('Fetching entities from Memory Center...');
        try {
            const res = await fetch('/api/entities');
            if (!res.ok) throw new Error('Failed to fetch entities');
            const data = await res.json();
            setEntities(data.entities);
            log(`Successfully fetched ${data.entities.length} entities.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch entities.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
        }
    }, [log, setStatus]);

    useEffect(() => {
        if (activeTab === 'structured') {
            fetchEntities();
        }
    }, [activeTab, fetchEntities]);
    
    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!entityForm.name?.trim()) errors.name = "Name is required.";
        if (!entityForm.type?.trim()) errors.type = "Type is required.";
        try {
            if (entityForm.details_json) JSON.parse(entityForm.details_json);
        } catch (e) {
            errors.details_json = "Must be valid JSON.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveEntity = async () => {
        if (!validateForm()) return;
        
        clearError();
        const isUpdating = !!entityForm.id;
        const url = isUpdating ? `/api/entities/${entityForm.id}` : '/api/entities';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entityForm),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} entity`);

            await fetchEntities();
            setIsEntityFormVisible(false);
            setEntityForm({});
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleDeleteEntity = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this entity?")) return;
        try {
            const res = await fetch(`/api/entities/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete entity');
            await fetchEntities();
        } catch (error) {
             setStatus({ error: (error as Error).message });
        }
    };

    const filteredEntities = useMemo(() => {
        return entities.filter(entity => 
            entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entity.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [entities, searchTerm]);

    const renderStructuredMemory = () => (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Structured Memory (Entities)</h3>
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
                        onClick={() => setIsEntityFormVisible(!isEntityFormVisible)} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm"
                        title="Manually add a new entity (person, place, concept) to the AI's structured memory."
                    >
                        <PlusIcon className="w-5 h-5" /> Add Entity
                    </button>
                </div>
            </div>
            {isEntityFormVisible && (
                <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input value={entityForm.name || ''} onChange={e => setEntityForm({...entityForm, name: e.target.value})} placeholder="Entity Name" className={`w-full p-2 bg-gray-700 rounded-lg text-sm ${formErrors.name ? 'border border-red-500' : ''}`}/>
                            {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                            <input value={entityForm.type || ''} onChange={e => setEntityForm({...entityForm, type: e.target.value})} placeholder="Entity Type (e.g., Person, Project)" className={`w-full p-2 bg-gray-700 rounded-lg text-sm ${formErrors.type ? 'border border-red-500' : ''}`}/>
                             {formErrors.type && <p className="text-xs text-red-400 mt-1">{formErrors.type}</p>}
                        </div>
                    </div>
                     <div>
                        <textarea value={entityForm.details_json || ''} onChange={e => setEntityForm({...entityForm, details_json: e.target.value})} placeholder='Details (JSON format, e.g., {"role": "Lead"})' className={`w-full p-2 bg-gray-700 rounded-lg text-sm font-mono ${formErrors.details_json ? 'border border-red-500' : ''}`} rows={3}></textarea>
                         {formErrors.details_json && <p className="text-xs text-red-400 mt-1">{formErrors.details_json}</p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSaveEntity} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                        <button onClick={() => { setIsEntityFormVisible(false); setEntityForm({}); setFormErrors({}); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Details</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntities.map(entity => (
                            <tr key={entity.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-medium">{entity.name}</td>
                                <td className="p-3">{entity.type}</td>
                                <td className="p-3"><code className="text-xs bg-gray-700 text-indigo-300 p-1 rounded-md">{entity.details_json}</code></td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEntityForm(entity); setIsEntityFormVisible(true); }} title="Edit this entity's details." className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteEntity(entity.id)} title="Permanently delete this entity from the AI's memory." className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
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
    
    // Placeholder for Procedural Memory Tab
    const renderProceduralMemory = () => (
         <div className="p-4 text-center text-gray-400">
            <h3 className="text-xl font-bold mb-4">Procedural Memory (Tools)</h3>
            <p>This section is under development.</p>
            <p className="text-sm mt-2">Soon you'll be able to add and manage custom tools for the AI to use.</p>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Memory Center</h2>
            </div>
            {/* Tabs could go here if more memory types are added */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'structured' && renderStructuredMemory()}
            </div>
        </div>
    );
};

export default MemoryCenter;