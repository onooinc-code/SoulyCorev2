
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { EntityDefinition } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon, ArrowsRightLeftIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from '@/components/providers/LogProvider';

type EntityFormState = Partial<EntityDefinition> & {
    aliases_str?: string;
};

const MergeConfirmationModal = ({
    onClose,
    onConfirm,
    entitiesToMerge,
} : {
    onClose: () => void;
    onConfirm: (targetId: string, sourceId: string) => void;
    entitiesToMerge: EntityDefinition[];
}) => {
    // This component now trusts its parent to only render it with a valid `entitiesToMerge` prop.
    // The check `if (entitiesToMerge.length < 2)` is removed to prevent returning null during exit animations.
    const [targetId, setTargetId] = useState<string | null>(entitiesToMerge[0]?.id || null);

    const [entityA, entityB] = entitiesToMerge;
    const targetEntity = targetId === entityA.id ? entityA : entityB;
    const sourceEntity = targetId === entityA.id ? entityB : entityA;
    
    const mergedAliases = [...new Set([
        ...(targetEntity.aliases || []), 
        ...(sourceEntity.aliases || []), 
        sourceEntity.name
    ])];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="font-bold text-lg">Confirm Entity Merge</h3>
                    <p className="text-sm text-gray-400 mt-1">Select the canonical (target) entity. The other entity's aliases and relationships will be merged into it, and then it will be deleted.</p>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6">
                    {/* Selection Column */}
                    <div className="col-span-1 space-y-4">
                        <h4 className="font-semibold">Select Target</h4>
                        <label className={`block p-3 rounded-lg border-2 cursor-pointer ${targetId === entityA.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700'}`}>
                            <input type="radio" name="target-entity" checked={targetId === entityA.id} onChange={() => setTargetId(entityA.id)} className="mr-2"/>
                            {entityA.name} <span className="text-xs text-gray-500">({entityA.type})</span>
                        </label>
                         <label className={`block p-3 rounded-lg border-2 cursor-pointer ${targetId === entityB.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700'}`}>
                            <input type="radio" name="target-entity" checked={targetId === entityB.id} onChange={() => setTargetId(entityB.id)} className="mr-2"/>
                            {entityB.name} <span className="text-xs text-gray-500">({entityB.type})</span>
                        </label>
                    </div>
                    {/* Preview Column */}
                    <div className="col-span-2 bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Merged Result Preview</h4>
                        <div className="text-sm space-y-2">
                            <p><strong>Name:</strong> {targetEntity.name}</p>
                            <p><strong>Type:</strong> {targetEntity.type}</p>
                            <p><strong>Description:</strong> {targetEntity.description}</p>
                             <p><strong>Aliases:</strong></p>
                            <div className="flex flex-wrap gap-1">
                                {mergedAliases.map(alias => <span key={alias} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{alias}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-b-lg flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm">Cancel</button>
                     <button onClick={() => onConfirm(targetEntity.id, sourceEntity.id)} disabled={!targetId} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50">Confirm & Merge</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


const EntityHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [entities, setEntities] = useState<EntityDefinition[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [entityForm, setEntityForm] = useState<EntityFormState>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

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

    const handleConfirmMerge = async (targetId: string, sourceId: string) => {
        log('Confirming merge', { targetId, sourceId });
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, sourceId }),
            });
            if (!res.ok) throw new Error('Failed to merge entities');
            
            await fetchEntities();
            setSelectedIds(new Set());
            setIsMergeModalOpen(false);

        } catch(error) {
             setStatus({ error: (error as Error).message });
        }
    };

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
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

    const entitiesToMerge = useMemo(() => {
        return entities.filter(e => selectedIds.has(e.id));
    }, [entities, selectedIds]);

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Manage Entities</h3>
                <div className="flex items-center gap-2">
                     <AnimatePresence>
                        {selectedIds.size === 2 && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setIsMergeModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-500 text-sm"
                            >
                                <ArrowsRightLeftIcon className="w-5 h-5" /> Merge Selected
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search entities..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 pr-2 py-1.5 bg-gray-700 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    </div>
                    <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm" title="Manually add a new entity to the AI's structured memory.">
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
                            <th className="p-3 w-4"></th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 w-1/3">Description</th>
                            <th className="p-3">Aliases</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntities.map(entity => (
                            <tr key={entity.id} className={`border-b border-gray-700 transition-colors ${selectedIds.has(entity.id) ? 'bg-indigo-900/50' : 'hover:bg-gray-700/50'}`}>
                                <td className="p-3"><input type="checkbox" checked={selectedIds.has(entity.id)} onChange={() => handleToggleSelection(entity.id)} className="bg-gray-700 border-gray-600 rounded" /></td>
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
            <AnimatePresence>
                {isMergeModalOpen && entitiesToMerge.length === 2 && (
                    <MergeConfirmationModal onClose={() => setIsMergeModalOpen(false)} onConfirm={handleConfirmMerge} entitiesToMerge={entitiesToMerge} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EntityHub;
