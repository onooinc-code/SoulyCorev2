// This file has been updated to include:
// 1. A new 'graph' view mode to visualize entity relationships.
// 2. An Entity Detail Panel that slides in when a row is clicked.
// 3. Inline editing for 'name' and 'description' fields in the list view.
// 4. A bulk actions toolbar for deleting, tagging, and changing types of multiple entities.
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { EntityDefinition } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon, ArrowsRightLeftIcon, Bars3Icon, Squares2X2Icon, ViewColumnsIcon, LinkIcon, TagIcon, WrenchScrewdriverIcon, BeakerIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from '@/components/providers/LogProvider';
import dynamic from 'next/dynamic';

const RelationshipGraph = dynamic(() => import('./RelationshipGraph'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p>Loading Relationship Graph...</p></div>
});

const EntityDetailPanel = dynamic(() => import('./EntityDetailPanel'), {
    ssr: false
});

const DuplicateFinderModal = dynamic(() => import('./DuplicateFinderModal'), {
    ssr: false
});

const PruneUnusedModal = dynamic(() => import('./PruneUnusedModal'), {
    ssr: false
});


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

type SortKey = keyof EntityDefinition;

interface EntityCardProps {
    entity: EntityDefinition;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const EntityCard: React.FC<EntityCardProps> = ({ entity, isSelected, onToggleSelection, onEdit, onDelete }) => (
    <motion.div 
        layout 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className={`p-4 rounded-lg border transition-colors ${isSelected ? 'bg-indigo-900/50 border-indigo-600' : 'bg-gray-700/50 border-gray-700 hover:border-gray-600'}`}
    >
        <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
                <input type="checkbox" checked={isSelected} onChange={onToggleSelection} className="mt-1 bg-gray-800 border-gray-600 rounded" />
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-100">{entity.name}</h4>
                    <p className="text-xs text-indigo-300 font-mono">{entity.type}</p>
                </div>
            </div>
            <div className="flex gap-1">
                <button onClick={onEdit} title="Edit" className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} title="Delete" className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
        {entity.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{entity.description}</p>}
        {Array.isArray(entity.aliases) && entity.aliases.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
                {entity.aliases.map(alias => (
                    <span key={alias} className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">{alias}</span>
                ))}
            </div>
        )}
    </motion.div>
);

const EntityHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [entities, setEntities] = useState<EntityDefinition[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [entityForm, setEntityForm] = useState<EntityFormState>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });
    const [filters, setFilters] = useState<{ type: string }>({ type: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'graph'>('list');
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        description: true, aliases: true, createdAt: true, tags: true
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    
    const [editingCell, setEditingCell] = useState<{ entityId: string; field: 'name' | 'description' } | null>(null);
    const [detailPanelEntity, setDetailPanelEntity] = useState<EntityDefinition | null>(null);

    const [isToolsMenuOpen, setToolsMenuOpen] = useState(false);
    const [isDuplicateFinderOpen, setIsDuplicateFinderOpen] = useState(false);
    const [isPruneUnusedOpen, setIsPruneUnusedOpen] = useState(false);


    const ITEMS_PER_PAGE = 20;

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
        if (!entityForm.type?.trim()) errors.type = "Type