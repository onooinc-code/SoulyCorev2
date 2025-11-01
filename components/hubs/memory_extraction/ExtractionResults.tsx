
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';
import { EntityDefinition, RelationshipGraphData } from '@/lib/types';
import { BrainIcon, LightbulbIcon, LinkIcon, ArrowDownOnSquareIcon, XIcon, ArrowsRightLeftIcon } from '@/components/Icons';

interface ExtractedData {
    entities: any[];
    knowledge: string[];
    relationships: any[];
}

interface ExtractionResultsProps {
    data: ExtractedData | null;
}

const EditableText = ({ value, onSave }: { value: string, onSave: (newValue: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);

    const handleSave = () => {
        onSave(text);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
                className="w-full bg-gray-900 p-1 rounded-md text-sm border border-indigo-500"
                autoFocus
            />
        );
    }

    return (
        <span onDoubleClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-gray-900/50 p-1 rounded-md">
            {value}
        </span>
    );
};


const ExtractionResults = ({ data }: ExtractionResultsProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    const [editableData, setEditableData] = useState<ExtractedData | null>(null);
    const [selection, setSelection] = useState<{ entities: Set<number>, knowledge: Set<number>, relationships: Set<number> }>({
        entities: new Set(),
        knowledge: new Set(),
        relationships: new Set(),
    });
    const [isMergeModalOpen, setMergeModalOpen] = useState(false);
    
    useEffect(() => {
        if (data) {
            setEditableData(JSON.parse(JSON.stringify(data))); // Deep copy
            setSelection({ entities: new Set(), knowledge: new Set(), relationships: new Set() });
        } else {
            setEditableData(null);
        }
    }, [data]);

    const handleSelectionChange = (type: 'entities' | 'knowledge' | 'relationships', index: number, isSelected: boolean) => {
        setSelection(prev => {
            const newSelection = new Set(prev[type]);
            if (isSelected) {
                newSelection.add(index);
            } else {
                newSelection.delete(index);
            }
            return { ...prev, [type]: newSelection };
        });
    };
    
    const handleUpdateItem = <T extends keyof ExtractedData>(type: T, index: number, field: keyof ExtractedData[T][number], value: any) => {
        setEditableData(prev => {
            if (!prev) return null;
            const newData = { ...prev };
            (newData[type][index] as any)[field] = value;
            return newData;
        });
    };
    
    const selectedEntitiesForMerge = editableData?.entities.filter((_, index) => selection.entities.has(index)) || [];
    
    const handleConfirmMerge = (targetEntityIndex: number, sourceEntityIndex: number) => {
        if (!editableData) return;

        const targetEntity = editableData.entities[targetEntityIndex];
        const sourceEntity = editableData.entities[sourceEntityIndex];

        // Merge aliases
        const mergedAliases = [...new Set([...(targetEntity.aliases || []), ...(sourceEntity.aliases || []), sourceEntity.name])];
        
        const newEntities = editableData.entities
            .map((entity, index) => index === targetEntityIndex ? { ...entity, aliases: mergedAliases } : entity)
            .filter((_, index) => index !== sourceEntityIndex);

        const newRelationships = editableData.relationships.map(rel => {
            let newRel = { ...rel };
            if (rel.source.toLowerCase() === sourceEntity.name.toLowerCase()) newRel.source = targetEntity.name;
            if (rel.target.toLowerCase() === sourceEntity.name.toLowerCase()) newRel.target = targetEntity.name;
            return newRel;
        });

        setEditableData({
            entities: newEntities,
            knowledge: editableData.knowledge,
            relationships: newRelationships,
        });

        setSelection({ entities: new Set(), knowledge: new Set(), relationships: new Set() });
        setMergeModalOpen(false);
        addNotification({type: 'info', title: 'Merge Prepared', message: 'The merge is ready. Click "Save Selected" to commit the changes.'});
    };


    const handleSaveSelected = async () => {
        if (!editableData) return;
        
        const selectedEntities = editableData.entities.filter((_, i) => selection.entities.has(i));
        const selectedKnowledge = editableData.knowledge.filter((_, i) => selection.knowledge.has(i));
        const selectedRelationships = editableData.relationships.filter((_, i) => selection.relationships.has(i));

        if (selectedEntities.length === 0 && selectedKnowledge.length === 0 && selectedRelationships.length === 0) {
            addNotification({type: 'warning', title: 'Nothing selected to save.'});
            return;
        }

        setIsSaving(true);
        addNotification({ type: 'info', title: 'Saving to Memory...', message: 'This may take a moment.' });
        try {
            // Step 1: Save all entities and build a name -> ID map.
            const savedEntities: EntityDefinition[] = await Promise.all(selectedEntities.map(async (entity) => {
                const res = await fetch('/api/entities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entity),
                });
                if (!res.ok) throw new Error(`Failed to save entity: ${entity.name}`);
                return res.json();
            }));

            const entityMap = new Map<string, string>();
            savedEntities.forEach(e => entityMap.set(e.name.toLowerCase(), e.id));
            
            // Step 2: Save all knowledge snippets.
            await Promise.all(selectedKnowledge.map(async (snippet) => {
                await fetch('/api/knowledge/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: snippet }),
                });
            }));

            // Step 3: Save all relationships using the new entity IDs.
            await Promise.all(selectedRelationships.map(async (rel) => {
                const sourceId = entityMap.get(rel.source.toLowerCase());
                const targetId = entityMap.get(rel.target.toLowerCase());
                if (sourceId && targetId) {
                    await fetch('/api/entities/relationships', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sourceEntityId: sourceId, targetEntityId: targetId, predicate: rel.predicate }),
                    });
                } else {
                    console.warn(`Skipping relationship, entity not found/saved: ${rel.source} -> ${rel.target}`);
                }
            }));
            
            addNotification({ type: 'success', title: 'Memory Updated', message: 'Selected information has been saved.' });
            setSelection({ entities: new Set(), knowledge: new Set(), relationships: new Set() });
        } catch (error) {
            addNotification({ type: 'error', title: 'Save Failed', message: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    if (!editableData) return null;

    const hasData = editableData.entities.length > 0 || editableData.knowledge.length > 0 || editableData.relationships.length > 0;

    return (
        <div className="p-4 space-y-4">
            <AnimatePresence>
                {hasData && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <button
                            onClick={handleSaveSelected}
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500 disabled:opacity-50"
                        >
                            <ArrowDownOnSquareIcon className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save Selected to Memory'}
                        </button>
                        {selectedEntitiesForMerge.length === 2 && (
                             <button onClick={() => setMergeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md font-semibold hover:bg-yellow-500">
                                <ArrowsRightLeftIcon className="w-5 h-5" />
                                Merge Selected
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {editableData.entities.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-2"><BrainIcon className="w-5 h-5"/> Entities</h3>
                    <div className="space-y-2">
                        {editableData.entities.map((e, i) => (
                            <div key={i} className={`p-3 rounded-md text-sm transition-colors ${selection.entities.has(i) ? 'bg-indigo-900/50' : 'bg-gray-700'}`}>
                                <div className="flex items-start gap-3">
                                    <input type="checkbox" checked={selection.entities.has(i)} onChange={(ev) => handleSelectionChange('entities', i, ev.target.checked)} className="mt-1"/>
                                    <div className="flex-1">
                                        <p>
                                            <strong><EditableText value={e.name} onSave={val => handleUpdateItem('entities', i, 'name', val)} /></strong>
                                            (<EditableText value={e.type} onSave={val => handleUpdateItem('entities', i, 'type', val)} />)
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1"><EditableText value={e.description} onSave={val => handleUpdateItem('entities', i, 'description', val)} /></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {editableData.knowledge.length > 0 && (
                 <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-2"><LightbulbIcon className="w-5 h-5"/> Knowledge Snippets</h3>
                    <ul className="space-y-2 text-sm">
                        {editableData.knowledge.map((k, i) => 
                            <li key={i} className={`p-2 rounded-md flex items-start gap-3 transition-colors ${selection.knowledge.has(i) ? 'bg-indigo-900/50' : 'bg-gray-700'}`}>
                                <input type="checkbox" checked={selection.knowledge.has(i)} onChange={(ev) => handleSelectionChange('knowledge', i, ev.target.checked)} className="mt-1"/>
                                <div className="flex-1"><EditableText value={k} onSave={val => handleUpdateItem('knowledge', i, null, val)} /></div>
                            </li>
                        )}
                    </ul>
                </div>
            )}
            {editableData.relationships.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-2"><LinkIcon className="w-5 h-5"/> Relationships</h3>
                     <div className="space-y-2 text-sm font-mono">
                        {editableData.relationships.map((r, i) => (
                            <div key={i} className={`p-2 rounded-md flex items-center gap-2 transition-colors ${selection.relationships.has(i) ? 'bg-indigo-900/50' : 'bg-gray-700'}`}>
                                <input type="checkbox" checked={selection.relationships.has(i)} onChange={(ev) => handleSelectionChange('relationships', i, ev.target.checked)}/>
                                <div className="flex-1">
                                    <span className="text-blue-400"><EditableText value={r.source} onSave={val => handleUpdateItem('relationships', i, 'source', val)} /></span>
                                    <span className="text-gray-400"> --[<EditableText value={r.predicate} onSave={val => handleUpdateItem('relationships', i, 'predicate', val)} />]--> </span>
                                    <span className="text-green-400"><EditableText value={r.target} onSave={val => handleUpdateItem('relationships', i, 'target', val)} /></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <AnimatePresence>
                {isMergeModalOpen && (
                    <MergeConfirmationModal 
                        entitiesToMerge={selectedEntitiesForMerge}
                        onClose={() => setMergeModalOpen(false)}
                        onConfirm={handleConfirmMerge}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const MergeConfirmationModal = ({ entitiesToMerge, onClose, onConfirm }: {
    entitiesToMerge: any[],
    onClose: () => void,
    onConfirm: (targetIndex: number, sourceIndex: number) => void
}) => {
    const [targetName, setTargetName] = useState(entitiesToMerge[0]?.name || '');

    if (entitiesToMerge.length !== 2) return null;

    const [entityA, entityB] = entitiesToMerge;
    const targetEntity = targetName === entityA.name ? entityA : entityB;
    const sourceEntity = targetName === entityA.name ? entityB : entityA;

    const mergedAliases = [...new Set([...(targetEntity.aliases || []), ...(sourceEntity.aliases || []), sourceEntity.name])];

    const handleConfirm = () => {
        const targetIndex = editableData.findIndex(e => e.name === targetName);
        const sourceIndex = editableData.findIndex(e => e.name !== targetName);
        onConfirm(targetIndex, sourceIndex);
    }
    const editableData = entitiesToMerge; // for context

    return (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="font-bold text-lg">Confirm Entity Merge</h3>
                    <p className="text-sm text-gray-400 mt-1">Select the canonical (target) entity. The other will be merged into it.</p>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6">
                    <div className="col-span-1 space-y-4">
                        <h4 className="font-semibold">Select Target</h4>
                        <label className={`block p-3 rounded-lg border-2 cursor-pointer ${targetName === entityA.name ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700'}`}>
                            <input type="radio" name="target-entity" checked={targetName === entityA.name} onChange={() => setTargetName(entityA.name)} className="mr-2"/>
                            {entityA.name} <span className="text-xs text-gray-500">({entityA.type})</span>
                        </label>
                         <label className={`block p-3 rounded-lg border-2 cursor-pointer ${targetName === entityB.name ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700'}`}>
                            <input type="radio" name="target-entity" checked={targetName === entityB.name} onChange={() => setTargetName(entityB.name)} className="mr-2"/>
                            {entityB.name} <span className="text-xs text-gray-500">({entityB.type})</span>
                        </label>
                    </div>
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
                     <button onClick={handleConfirm} className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm">Prepare Merge</button>
                </div>
            </motion.div>
        </motion.div>
    )
};


export default ExtractionResults;
