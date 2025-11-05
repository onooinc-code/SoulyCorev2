"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TrashIcon, PlusIcon } from '@/components/Icons';
import type { EntityDefinition, EntityRelationship } from '@/lib/types';
import { useNotification } from '@/lib/hooks/use-notifications';

interface SplitEntityModalProps {
    sourceEntity: EntityDefinition;
    onClose: () => void;
    onSplitSuccess: () => void;
}

type NewEntity = { id: string, name: string, type: string, description: string };
type RelationshipMigration = { relationshipId: string; newOwnerEntityId: string | 'DELETE' };

const SplitEntityModal = ({ sourceEntity, onClose, onSplitSuccess }: SplitEntityModalProps) => {
    const [step, setStep] = useState(1);
    const [newEntities, setNewEntities] = useState<NewEntity[]>([
        { id: 'new_1', name: '', type: sourceEntity.type, description: '' },
        { id: 'new_2', name: '', type: sourceEntity.type, description: '' },
    ]);
    const [relationships, setRelationships] = useState<(EntityRelationship & { sourceName: string, targetName: string, predicateName: string })[]>([]);
    const [migrations, setMigrations] = useState<RelationshipMigration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        const fetchRelationships = async () => {
            // This is a simplified fetch; a real app might need a dedicated endpoint
            // For now, we assume relationships are passed or fetched from a broader context
            // Let's create a mock endpoint call
            try {
                const res = await fetch(`/api/entities/${sourceEntity.id}/relationships`);
                if (!res.ok) throw new Error("Failed to fetch relationships");
                const data = await res.json();
                setRelationships(data);
                setMigrations(data.map((r: any) => ({ relationshipId: r.id, newOwnerEntityId: 'new_1' })));
            } catch (error) {
                addNotification({ type: 'error', title: 'Error', message: 'Could not fetch relationships for splitting.' });
            }
        };
        fetchRelationships();
    }, [sourceEntity, addNotification]);
    
    const handleUpdateNewEntity = (index: number, field: keyof NewEntity, value: string) => {
        const updated = [...newEntities];
        updated[index] = { ...updated[index], [field]: value };
        setNewEntities(updated);
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (newEntities.some(e => !e.name.trim() || !e.type.trim())) {
                addNotification({ type: 'warning', title: 'Validation Error', message: 'All new entities must have a name and type.' });
                return;
            }
        }
        setStep(prev => prev + 1);
    };

    const handleSplit = async () => {
        setIsLoading(true);
        try {
            const payload = {
                sourceEntityId: sourceEntity.id,
                newEntities: newEntities.map(({ id, ...rest }) => rest), // Don't send temporary ID
                relationshipMigrations: migrations,
            };
            const res = await fetch('/api/entities/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to split entity.");
            }
            addNotification({ type: 'success', title: 'Split Successful', message: `Entity "${sourceEntity.name}" has been split.` });
            onSplitSuccess();
            onClose();
        } catch (error) {
            addNotification({ type: 'error', title: 'Split Failed', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h4 className="font-semibold">Step 1: Define New Entities</h4>
            <p className="text-sm text-gray-400">Define the new entities that will be created from "{sourceEntity.name}".</p>
            {newEntities.map((entity, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg space-y-2">
                    <input value={entity.name} onChange={e => handleUpdateNewEntity(index, 'name', e.target.value)} placeholder={`New Entity ${index + 1} Name`} className="w-full p-2 bg-gray-700 rounded-md text-sm" />
                    <input value={entity.type} onChange={e => handleUpdateNewEntity(index, 'type', e.target.value)} placeholder="Type" className="w-full p-2 bg-gray-700 rounded-md text-sm" />
                    <textarea value={entity.description} onChange={e => handleUpdateNewEntity(index, 'description', e.target.value)} placeholder="Description" className="w-full p-2 bg-gray-700 rounded-md text-sm" rows={2}></textarea>
                </div>
            ))}
             <button onClick={() => setNewEntities([...newEntities, { id: `new_${newEntities.length+1}`, name: '', type: sourceEntity.type, description: '' }])} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><PlusIcon className="w-4 h-4" /> Add another entity</button>
        </div>
    );
    
    const renderStep2 = () => (
        <div>
            <h4 className="font-semibold">Step 2: Migrate Relationships</h4>
            <p className="text-sm text-gray-400 mb-4">Assign each relationship of "{sourceEntity.name}" to one of the new entities or delete it.</p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {relationships.map((rel, index) => {
                    const isSource = rel.sourceEntityId === sourceEntity.id;
                    const otherEntityName = isSource ? rel.targetName : rel.sourceName;
                    const direction = isSource ? '-->' : '<--';
                    
                    return (
                        <div key={rel.id} className="p-3 bg-gray-900/50 rounded-lg flex items-center justify-between">
                            <span className="font-mono text-xs">
                                {isSource ? <b className="text-yellow-400">...</b> : otherEntityName} {direction} [{rel.predicateName}] {direction} {!isSource ? <b className="text-yellow-400">...</b> : otherEntityName}
                            </span>
                            <select 
                                value={migrations[index]?.newOwnerEntityId || ''}
                                onChange={(e) => {
                                    const newMigrations = [...migrations];
                                    newMigrations[index] = { relationshipId: rel.id, newOwnerEntityId: e.target.value };
                                    setMigrations(newMigrations);
                                }}
                                className="p-1 bg-gray-700 rounded text-xs"
                            >
                                <option value="" disabled>Assign to...</option>
                                {newEntities.map(ne => <option key={ne.id} value={ne.id}>{ne.name}</option>)}
                                <option value="DELETE">-- Delete Relationship --</option>
                            </select>
                        </div>
                    )
                })}
            </div>
        </div>
    );
    
    const renderStep3 = () => (
        <div>
            <h4 className="font-semibold">Step 3: Confirm Split</h4>
            <p className="text-sm text-gray-400 mb-4">Review the changes before splitting the entity. This action cannot be undone.</p>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                <div>
                    <h5 className="font-bold text-green-400">Entities to Create:</h5>
                    <ul className="list-disc list-inside text-sm pl-2">
                        {newEntities.map(e => <li key={e.id}>{e.name} ({e.type})</li>)}
                    </ul>
                </div>
                <div>
                     <h5 className="font-bold text-yellow-400">Relationships to Migrate:</h5>
                      <ul className="list-disc list-inside text-sm pl-2">
                        {migrations.filter(m => m.newOwnerEntityId !== 'DELETE').length} relationship(s) will be re-assigned.
                    </ul>
                </div>
                 <div>
                     <h5 className="font-bold text-red-400">Items to Delete:</h5>
                     <ul className="list-disc list-inside text-sm pl-2">
                        <li>Original Entity: "{sourceEntity.name}"</li>
                        <li>{migrations.filter(m => m.newOwnerEntityId === 'DELETE').length} relationship(s) will be deleted.</li>
                    </ul>
                </div>
            </div>
        </div>
    );


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">Split Entity: {sourceEntity.name}</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </motion.div>
                    </AnimatePresence>
                </main>
                <footer className="flex justify-between p-4 bg-gray-900/50 rounded-b-lg">
                    <button onClick={() => setStep(s => s - 1)} disabled={step === 1 || isLoading} className="px-4 py-2 text-sm bg-gray-600 rounded-md disabled:opacity-50">Back</button>
                    {step < 3 ? (
                        <button onClick={handleNextStep} disabled={isLoading} className="px-4 py-2 text-sm bg-indigo-600 rounded-md">Next</button>
                    ) : (
                        <button onClick={handleSplit} disabled={isLoading} className="px-4 py-2 text-sm bg-green-600 rounded-md disabled:opacity-50">{isLoading ? 'Splitting...' : 'Confirm & Split'}</button>
                    )}
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default SplitEntityModal;