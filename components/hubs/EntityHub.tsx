// This file has been updated to include:
// 1. A new 'graph' view mode to visualize entity relationships.
// 2. An Entity Detail Panel that slides in when a row is clicked.
// 3. Inline editing for 'name' and 'description' fields in the list view.
// 4. A bulk actions toolbar for deleting, tagging, and changing types of multiple entities.
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { EntityDefinition, Brain } from '@/lib/types';
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

const AICategorizerModal = dynamic(() => import('./AICategorizerModal'), {
    ssr: false
});

const FactVerifierModal = dynamic(() => import('./FactVerifierModal'), {
    ssr: false
});

const DetailedListView = dynamic(() => import('./DetailedListView'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p>Loading Detailed View...</p></div>
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

type SortKey = keyof EntityDefinition | 'relevancyScore';
type ViewMode = 'list' | 'grid' | 'graph' | 'detailed-list';


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

const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};


const EntityHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [entities, setEntities] = useState<EntityDefinition[]>([]);
    const [brains, setBrains] = useState<Brain[]>([]);
    const [activeBrainId, setActiveBrainId] = useState<string>('none');
    
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [entityForm, setEntityForm] = useState<EntityFormState>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'relevancyScore', direction: 'descending' });
    const [filters, setFilters] = useState<{ type: string }>({ type: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
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
    const [isCategorizerOpen, setIsCategorizerOpen] = useState(false);
    const [isFactVerifierOpen, setIsFactVerifierOpen] = useState(false);


    const ITEMS_PER_PAGE = 20;

    const fetchEntities = useCallback(async (brainId: string) => {
        log('Fetching entities for Entity Hub...', { brainId });
        try {
            const res = await fetch(`/api/entities?brainId=${brainId}`);
            if (!res.ok) throw new Error('Failed to fetch entities');
            const data = await res.json();
            setEntities(data.entities);
            log(`Successfully fetched ${data.entities.length} entities for brain ${brainId}.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch entities.', { error: { message: errorMessage } }, 'error');
        }
    }, [log, setStatus]);
    
    useEffect(() => {
        const fetchBrains = async () => {
            try {
                const res = await fetch('/api/brains');
                if (res.ok) {
                    const data = await res.json();
                    setBrains(data);
                }
            } catch (error) {
                log('Failed to fetch brains', { error }, 'error');
            }
        };
        fetchBrains();
    }, [log]);

    useEffect(() => {
        fetchEntities(activeBrainId);
    }, [fetchEntities, activeBrainId]);
    
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
                aliases_str: Array.isArray(entity.aliases) ? entity.aliases.join(', ') : '',
            });
        } else {
            setEntityForm({ type: 'Misc', brainId: activeBrainId === 'none' ? undefined : activeBrainId });
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
            aliases: entityForm.aliases_str?.split(',').map(s => s.trim()).filter(Boolean) || [],
        };
        delete payload.aliases_str;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} entity`);

            await fetchEntities(activeBrainId);
            setIsFormVisible(false);
            setEntityForm({});
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleDeleteEntity = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this entity? This may affect existing relationships.")) return;
        try {
            const res = await fetch(`/api/entities/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete entity');
            await fetchEntities(activeBrainId);
        } catch (error) {
             setStatus({ error: (error as Error).message });
        }
    };
    
    const handleBulkAction = async (action: 'delete' | 'change_type' | 'add_tags', payload?: any) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        
        let confirmMessage = `Are you sure you want to ${action.replace('_', ' ')} ${ids.length} entities?`;
        if (action === 'delete') confirmMessage += ' This action cannot be undone.';
        
        if (!window.confirm(confirmMessage)) return;

        try {
            const res = await fetch('/api/entities/bulk-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ids, payload }),
            });
            if (!res.ok) throw new Error(`Bulk ${action} failed.`);
            await fetchEntities(activeBrainId);
            setSelectedIds(new Set());
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleMergeEntities = async (targetId: string, sourceId: string) => {
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, sourceId }),
            });
             if (!res.ok) throw new Error('Merge failed.');
             await fetchEntities(activeBrainId);
             setSelectedIds(new Set());
             setIsMergeModalOpen(false);
        } catch(error) {
            setStatus({ error: (error as Error).message });
        }
    };

    const handleCellUpdate = async (entityId: string, field: 'name' | 'description', value: string) => {
        const originalEntity = entities.find(e => e.id === entityId);
        if (!originalEntity || originalEntity[field] === value) {
            setEditingCell(null);
            return;
        }

        const updatedEntity = { ...originalEntity, [field]: value };

        // Optimistic update
        setEntities(prev => prev.map(e => e.id === entityId ? updatedEntity : e));
        setEditingCell(null);

        try {
            const res = await fetch(`/api/entities/${entityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEntity),
            });
            if (!res.ok) throw new Error('Failed to save cell update.');
            await fetchEntities(activeBrainId); // Re-sync with DB
        } catch (error) {
            setStatus({ error: (error as Error).message });
            setEntities(prev => prev.map(e => e.id === entityId ? originalEntity : e)); // Revert
        }
    };

    // Calculate relevancy scores
    const entitiesWithRelevancy = useMemo(() => {
        if (entities.length === 0) return [];

        const now = new Date().getTime();
        const entitiesWithRawScore = entities.map(entity => {
            const lastAccessed = entity.lastAccessedAt ? new Date(entity.lastAccessedAt).getTime() : now - (365 * 24 * 3600 * 1000); // Default to 1 year ago if never accessed
            const daysSinceAccess = (now - lastAccessed) / (1000 * 3600 * 24);
            const recencyScore = Math.exp(-0.05 * daysSinceAccess); // Slower decay
            const frequencyScore = Math.log10((entity.accessCount || 0) + 1);
            const rawScore = (recencyScore * 0.6) + (frequencyScore * 0.4);
            return { ...entity, rawScore };
        });

        const maxRawScore = Math.max(...entitiesWithRawScore.map(e => e.rawScore), 1); // Avoid division by zero

        return entitiesWithRawScore.map(entity => ({
            ...entity,
            relevancyScore: (entity.rawScore / maxRawScore) * 100,
        }));
    }, [entities]);

    const sortedAndFilteredEntities = useMemo(() => {
        let filtered = entitiesWithRelevancy.filter(e => {
            const typeMatch = filters.type === 'all' || e.type === filters.type;
            const searchMatch = searchTerm === '' || 
                e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.type.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && searchMatch;
        });

        filtered.sort((a, b) => {
            const aVal = a[sortConfig.key as keyof typeof a] as any;
            const bVal = b[sortConfig.key as keyof typeof b] as any;
            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }, [entitiesWithRelevancy, searchTerm, sortConfig, filters]);
    
    const paginatedEntities = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredEntities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredEntities, currentPage]);

    const entityTypes = useMemo(() => ['all', ...Array.from(new Set(entities.map(e => e.type)))], [entities]);
    const totalPages = Math.ceil(sortedAndFilteredEntities.length / ITEMS_PER_PAGE);
    
    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ sortKey, label }: { sortKey: SortKey; label: string }) => (
        <th className="p-2 text-left cursor-pointer" onClick={() => requestSort(sortKey)}>
            {label}
            {sortConfig.key === sortKey && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
        </th>
    );

    const toggleSelection = (id: string) => {
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
    
    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedEntities.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedEntities.map(e => e.id)));
        }
    };

    return (
        <div className="flex flex-col h-full p-4 relative">
            <AnimatePresence>
                {detailPanelEntity && (
                    <EntityDetailPanel 
                        entity={detailPanelEntity} 
                        onClose={() => setDetailPanelEntity(null)}
                        onRefresh={() => fetchEntities(activeBrainId)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isMergeModalOpen && (
                    <MergeConfirmationModal 
                        entitiesToMerge={entities.filter(e => selectedIds.has(e.id))}
                        onClose={() => setIsMergeModalOpen(false)}
                        onConfirm={handleMergeEntities}
                    />
                )}
            </AnimatePresence>
             <AnimatePresence>
                {isDuplicateFinderOpen && <DuplicateFinderModal onClose={() => setIsDuplicateFinderOpen(false)} />}
            </AnimatePresence>
             <AnimatePresence>
                {isPruneUnusedOpen && <PruneUnusedModal onClose={() => { setIsPruneUnusedOpen(false); fetchEntities(activeBrainId); }} />}
            </AnimatePresence>
            <AnimatePresence>
                {isCategorizerOpen && <AICategorizerModal onClose={() => { setIsCategorizerOpen(false); fetchEntities(activeBrainId); }} />}
            </AnimatePresence>
            <AnimatePresence>
                {isFactVerifierOpen && <FactVerifierModal onClose={() => { setIsFactVerifierOpen(false); fetchEntities(activeBrainId); }} />}
            </AnimatePresence>


            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold">Entity Hub</h3>
                <div className="flex items-center gap-2">
                     <div className="relative">
                        <button onClick={() => setToolsMenuOpen(prev => !prev)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm">
                            <WrenchScrewdriverIcon className="w-4 h-4" /> Tools
                        </button>
                        <AnimatePresence>
                            {isToolsMenuOpen && (
                                <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                                    <button onClick={() => { setIsFactVerifierOpen(true); setToolsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700"><BeakerIcon className="w-4 h-4" /> Verify Facts</button>
                                    <button onClick={() => { setIsDuplicateFinderOpen(true); setToolsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700"><BeakerIcon className="w-4 h-4" /> Find Duplicates</button>
                                    <button onClick={() => { setIsPruneUnusedOpen(true); setToolsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700"><TrashIcon className="w-4 h-4" /> Prune Unused</button>
                                    <button onClick={() => { setIsCategorizerOpen(true); setToolsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700"><BeakerIcon className="w-4 h-4" /> Suggest Categories</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm" title="Define a new entity for the AI's memory.">
                        <PlusIcon className="w-5 h-5" /> Add Entity
                    </button>
                </div>
            </div>
            
             <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <select value={activeBrainId} onChange={e => setActiveBrainId(e.target.value)} className="bg-gray-700 rounded-md px-2 py-1.5 text-sm">
                        <option value="none">Default (No Brain)</option>
                        {brains.map(brain => <option key={brain.id} value={brain.id}>{brain.name}</option>)}
                        <option value="all">All Brains</option>
                    </select>
                    <div className="relative"><SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search entities..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 rounded-md pl-8 pr-2 py-1.5 text-sm" /></div>
                    <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} className="bg-gray-700 rounded-md px-2 py-1.5 text-sm"><option value="all">All Types</option>{entityTypes.slice(1).map(type => <option key={type} value={type}>{type}</option>)}</select>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}><Bars3Icon className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('detailed-list')} className={`p-1.5 rounded-md ${viewMode === 'detailed-list' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}><ViewColumnsIcon className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}><Squares2X2Icon className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('graph')} className={`p-1.5 rounded-md ${viewMode === 'graph' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}><LinkIcon className="w-5 h-5" /></button>
                </div>
            </div>

             <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="mb-4 bg-gray-700/50 p-2 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-semibold">{selectedIds.size} selected</span>
                        <div className="flex items-center gap-2">
                            {selectedIds.size === 2 && <button onClick={() => setIsMergeModalOpen(true)} className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-600 rounded-md"><ArrowsRightLeftIcon className="w-4 h-4" /> Merge</button>}
                            <button onClick={() => handleBulkAction('add_tags', { tags: [prompt("Enter tag to add:")?.trim()].filter(Boolean) })} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 rounded-md"><TagIcon className="w-4 h-4" /> Add Tag</button>
                            <button onClick={() => handleBulkAction('change_type', { newType: prompt("Enter new type:") })} className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 rounded-md"><WrenchScrewdriverIcon className="w-4 h-4" /> Change Type</button>
                            <button onClick={() => handleBulkAction('delete')} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 rounded-md"><TrashIcon className="w-4 h-4" /> Delete</button>
                            <button onClick={() => setSelectedIds(new Set())} className="p-1"><XIcon className="w-4 h-4" /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            <div className="flex-1 overflow-auto">
                {viewMode === 'list' && (
                     <table className="w-full text-sm text-left text-gray-300 table-fixed">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0 z-10">
                            <tr>
                                <th className="p-2 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === paginatedEntities.length && paginatedEntities.length > 0} className="bg-gray-800 border-gray-600 rounded" /></th>
                                <SortableHeader sortKey="name" label="Name" />
                                <SortableHeader sortKey="type" label="Type" />
                                <SortableHeader sortKey="relevancyScore" label="Relevancy" />
                                {visibleColumns.description && <th className="p-2 text-left">Description</th>}
                                <SortableHeader sortKey="lastAccessedAt" label="Last Accessed" />
                                {visibleColumns.createdAt && <SortableHeader sortKey="createdAt" label="Created" />}
                                <th className="p-2 text-left w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEntities.map(entity => {
                                const score = entity.relevancyScore || 0;
                                let barColor = 'bg-red-500';
                                if (score > 70) barColor = 'bg-green-500';
                                else if (score > 30) barColor = 'bg-yellow-500';

                                return (
                                <tr key={entity.id} onClick={() => setDetailPanelEntity(entity)} className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer">
                                    <td className="p-2" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(entity.id)} onChange={() => toggleSelection(entity.id)} className="bg-gray-800 border-gray-600 rounded" /></td>
                                    <td className="p-2 font-medium truncate" onDoubleClick={() => setEditingCell({ entityId: entity.id, field: 'name' })}>{editingCell?.entityId === entity.id && editingCell.field === 'name' ? <input type="text" defaultValue={entity.name} onBlur={e => handleCellUpdate(entity.id, 'name', e.target.value)} autoFocus className="bg-gray-600 w-full" /> : entity.name}</td>
                                    <td className="p-2 font-mono text-xs text-indigo-300 truncate">{entity.type}</td>
                                    <td className="p-2">
                                        <div className="flex items-center gap-2" title={`Score: ${score.toFixed(1)}%`}>
                                            <div className="w-full bg-gray-600 rounded-full h-1.5"><div className={`${barColor} h-1.5 rounded-full`} style={{width: `${score}%`}}></div></div>
                                            <span className="text-xs text-gray-400">{score.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    {visibleColumns.description && <td className="p-2 text-xs text-gray-400 truncate" onDoubleClick={() => setEditingCell({ entityId: entity.id, field: 'description' })}>{editingCell?.entityId === entity.id && editingCell.field === 'description' ? <textarea defaultValue={entity.description} onBlur={e => handleCellUpdate(entity.id, 'description', e.target.value)} autoFocus className="bg-gray-600 w-full h-16" /> : entity.description}</td>}
                                    <td className="p-2 text-xs text-gray-500">{entity.lastAccessedAt ? getRelativeTime(new Date(entity.lastAccessedAt)) : 'Never'}</td>
                                    {visibleColumns.createdAt && <td className="p-2 text-xs text-gray-500">{new Date(entity.createdAt).toLocaleDateString()}</td>}
                                    <td className="p-2" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1"><button onClick={() => handleOpenForm(entity)} title="Edit" className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button><button onClick={() => handleDeleteEntity(entity.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button></div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedEntities.map(entity => (
                            <EntityCard key={entity.id} entity={entity} isSelected={selectedIds.has(entity.id)} onToggleSelection={() => toggleSelection(entity.id)} onEdit={() => handleOpenForm(entity)} onDelete={() => handleDeleteEntity(entity.id)} />
                        ))}
                    </div>
                )}
                {viewMode === 'graph' && (
                    <RelationshipGraph />
                )}
                {viewMode === 'detailed-list' && (
                    <DetailedListView />
                )}
            </div>
             <div className="flex justify-between items-center mt-4 flex-shrink-0">
                <span className="text-xs text-gray-400">Showing {paginatedEntities.length} of {sortedAndFilteredEntities.length} entities</span>
                {totalPages > 1 && (
                     <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-50">Prev</button>
                        <span className="text-xs">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-50">Next</button>
                    </div>
                )}
            {/* FIX: Corrected a typo in the closing div tag. */}
            </div>
        </div>
    );
};

export default EntityHub;