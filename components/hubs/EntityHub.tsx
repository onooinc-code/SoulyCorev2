// This file has been updated to include:
// 1. A new 'graph' view mode to visualize entity relationships.
// 2. An Entity Detail Panel that slides in when a row is clicked.
// 3. Inline editing for 'name' and 'description' fields in the list view.
// 4. A bulk actions toolbar for deleting, tagging, and changing types of multiple entities.
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { EntityDefinition } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon, ArrowsRightLeftIcon, Bars3Icon, Squares2X2Icon, ViewColumnsIcon, LinkIcon, TagIcon } from '@/components/Icons';
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
        if (!entityForm.type?.trim()) errors.type = "Type is required.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleOpenForm = (entity: EntityDefinition | null = null) => {
        if (entity) {
            setEntityForm({ ...entity, aliases_str: Array.isArray(entity.aliases) ? entity.aliases.join(', ') : '' });
        } else {
            setEntityForm({ aliases_str: '' });
        }
        setIsFormVisible(true);
    };

    const handleSaveEntity = async (entityToSave: Partial<EntityDefinition>) => {
        const isUpdating = !!entityToSave.id;
        const url = isUpdating ? `/api/entities/${entityToSave.id}` : '/api/entities';
        const method = isUpdating ? 'PUT' : 'POST';

        let payload = { ...entityToSave };
        if ('aliases_str' in payload) {
            // @ts-ignore
            payload.aliases = payload.aliases_str?.split(',').map(a => a.trim()).filter(Boolean) || [];
            // @ts-ignore
            delete payload.aliases_str;
        }

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
            setEditingCell(null);
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleDeleteEntity = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        await handleBulkAction('delete', [id]);
    };

    const handleConfirmMerge = async (targetId: string, sourceId: string) => {
        log('Confirming merge', { targetId, sourceId });
        setStatus({ currentAction: 'Merging entities...' });
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, sourceId }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to merge entities');
            }
            await fetchEntities();
            setSelectedIds(new Set());
            setIsMergeModalOpen(false);
        } catch(error) {
             setStatus({ error: (error as Error).message });
        } finally {
            setStatus({ currentAction: null });
        }
    };
    
    const handleBulkAction = async (action: 'delete' | 'change_type' | 'add_tags', ids: string[], payload?: any) => {
        if (ids.length === 0) return;
        
        let confirmMessage = `Are you sure you want to ${action.replace('_', ' ')} ${ids.length} entities?`;
        if (action === 'delete') confirmMessage += " This cannot be undone.";

        if (!window.confirm(confirmMessage)) return;

        setStatus({ currentAction: `Bulk ${action}...` });
        try {
            const res = await fetch('/api/entities/bulk-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ids, payload }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Bulk action failed');
            }
            await fetchEntities();
            setSelectedIds(new Set());
        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setStatus({ currentAction: null });
        }
    };

    const handleBulkChangeType = () => {
        const newType = prompt(`Enter the new type for the ${selectedIds.size} selected entities:`);
        if (newType && newType.trim()) {
            handleBulkAction('change_type', Array.from(selectedIds), { newType: newType.trim() });
        }
    };

    const handleBulkAddTags = () => {
        const tagsStr = prompt(`Enter comma-separated tags to add to the ${selectedIds.size} selected entities:`);
        if (tagsStr && tagsStr.trim()) {
            const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
            handleBulkAction('add_tags', Array.from(selectedIds), { tags });
        }
    };

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const entityTypes = useMemo(() => ['all', ...Array.from(new Set(entities.map(e => e.type)))], [entities]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const sortedAndFilteredEntities = useMemo(() => {
        let items = [...entities];
        if (filters.type !== 'all') items = items.filter(e => e.type === filters.type);
        if (searchTerm) {
             const lower = searchTerm.toLowerCase();
             items = items.filter(e => 
                e.name.toLowerCase().includes(lower) ||
                e.type.toLowerCase().includes(lower) ||
                e.description?.toLowerCase().includes(lower) ||
                (e.aliases || []).some(a => a.toLowerCase().includes(lower)) ||
                (e.tags || []).some(t => t.toLowerCase().includes(lower))
            );
        }
        items.sort((a, b) => {
            const aVal = a[sortConfig.key] as any;
            const bVal = b[sortConfig.key] as any;
            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return items;
    }, [entities, searchTerm, filters, sortConfig]);

    const paginatedEntities = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredEntities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredEntities, currentPage]);

    const totalPages = Math.ceil(sortedAndFilteredEntities.length / ITEMS_PER_PAGE);
    const entitiesToMerge = useMemo(() => entities.filter(e => selectedIds.has(e.id)), [entities, selectedIds]);

    const SortableHeader = ({ sortKey, label, className }: { sortKey: SortKey; label: string; className?: string }) => (
        <th className={`p-3 cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
            {label} {sortConfig.key === sortKey && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
        </th>
    );
    
    const renderContent = () => {
        if (viewMode === 'graph') {
            return <RelationshipGraph />;
        }
        if (viewMode === 'list') {
             return (
                <table className="w-full text-sm text-left text-gray-300 table-fixed">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                        <tr>
                            <th className="p-3 w-10"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? new Set(paginatedEntities.map(en => en.id)) : new Set())} /></th>
                            <SortableHeader sortKey="name" label="Name" className="w-1/5" />
                            <SortableHeader sortKey="type" label="Type" className="w-1/6" />
                            {visibleColumns.description && <th className="p-3 w-1/3 text-left">Description</th>}
                            {visibleColumns.aliases && <th className="p-3 text-left">Aliases</th>}
                            {visibleColumns.tags && <th className="p-3 text-left">Tags</th>}
                            {visibleColumns.createdAt && <SortableHeader sortKey="createdAt" label="Created" className="text-left" />}
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEntities.map(entity => (
                            <tr key={entity.id} className={`border-b border-gray-700 transition-colors ${selectedIds.has(entity.id) ? 'bg-indigo-900/50' : 'hover:bg-gray-700/50'}`}>
                                <td className="p-3"><input type="checkbox" checked={selectedIds.has(entity.id)} onChange={() => handleToggleSelection(entity.id)} className="bg-gray-700 border-gray-600 rounded" /></td>
                                <td onDoubleClick={() => setEditingCell({ entityId: entity.id, field: 'name' })} onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'INPUT') setDetailPanelEntity(entity) }} className="p-3 font-medium truncate cursor-pointer">
                                    {editingCell?.entityId === entity.id && editingCell?.field === 'name' ? (
                                        <input type="text" defaultValue={entity.name} autoFocus onBlur={(e) => handleSaveEntity({ ...entity, name: e.target.value })} onKeyDown={e => {if(e.key==='Enter') (e.target as HTMLInputElement).blur()}} className="bg-gray-600 w-full rounded px-1" />
                                    ) : entity.name}
                                </td>
                                <td className="p-3 truncate" onClick={() => setDetailPanelEntity(entity)}>{entity.type}</td>
                                {visibleColumns.description && <td onDoubleClick={() => setEditingCell({ entityId: entity.id, field: 'description' })} onClick={() => setDetailPanelEntity(entity)} className="p-3 text-gray-400 text-xs truncate cursor-pointer">
                                    {editingCell?.entityId === entity.id && editingCell?.field === 'description' ? (
                                        <input type="text" defaultValue={entity.description} autoFocus onBlur={(e) => handleSaveEntity({ ...entity, description: e.target.value })} onKeyDown={e => {if(e.key==='Enter') (e.target as HTMLInputElement).blur()}} className="bg-gray-600 w-full rounded px-1" />
                                    ) : entity.description}
                                </td>}
                                {visibleColumns.aliases && <td className="p-3" onClick={() => setDetailPanelEntity(entity)}>{/* ... aliases ... */}</td>}
                                {visibleColumns.tags && <td className="p-3" onClick={() => setDetailPanelEntity(entity)}>
                                    <div className="flex flex-wrap gap-1">
                                        {(entity.tags || []).slice(0, 2).map(tag => <span key={tag} className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">{tag}</span>)}
                                        {(entity.tags || []).length > 2 && <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">...</span>}
                                    </div>
                                </td>}
                                {visibleColumns.createdAt && <td className="p-3 text-gray-500 text-xs" onClick={() => setDetailPanelEntity(entity)}>{new Date(entity.createdAt).toLocaleDateString()}</td>}
                                <td className="p-3">{/* ... actions ... */}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             );
        }
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedEntities.map(entity => (
                        <EntityCard key={entity.id} entity={entity} isSelected={selectedIds.has(entity.id)} onToggleSelection={() => handleToggleSelection(entity.id)} onEdit={() => handleOpenForm(entity)} onDelete={() => handleDeleteEntity(entity.id)} />
                    ))}
                </div>
            )
        }
    };

    return (
        <div className="flex flex-col h-full p-4 relative overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold">Manage Entities</h3>
                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-gray-700 rounded-md">
                        <button onClick={() => setViewMode('list')} className={`p-1 rounded-sm ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}><Bars3Icon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1 rounded-sm ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}><Squares2X2Icon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('graph')} className={`p-1 rounded-sm ${viewMode === 'graph' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}><LinkIcon className="w-5 h-5"/></button>
                    </div>
                    {/* Filters & Actions */}
                    <select value={filters.type} onChange={e => {setFilters({ type: e.target.value }); setCurrentPage(1);}} className="py-1.5 bg-gray-700 text-sm rounded-md"><option value="all">All Types</option>{entityTypes.slice(1).map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <div className="relative"><SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="pl-8 pr-2 py-1.5 bg-gray-700 text-sm rounded-md"/></div>
                    <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm"><PlusIcon className="w-5 h-5" /> Add Entity</button>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            <AnimatePresence>
            {selectedIds.size > 0 && (
                <motion.div initial={{y: -50}} animate={{y:0}} exit={{y:-50}} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                    <span className="text-sm font-semibold px-2">{selectedIds.size} selected</span>
                    <button onClick={handleBulkAddTags} className="flex items-center gap-1 p-2 rounded-full hover:bg-white/10" title="Add Tags"><TagIcon className="w-5 h-5"/></button>
                    <button onClick={handleBulkChangeType} className="flex items-center gap-1 p-2 rounded-full hover:bg-white/10" title="Change Type"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleBulkAction('delete', Array.from(selectedIds))} className="flex items-center gap-1 p-2 rounded-full hover:bg-red-500/20 text-red-400" title="Delete Selected"><TrashIcon className="w-5 h-5"/></button>
                     <div className="w-px h-5 bg-gray-600 mx-1" />
                    <button onClick={() => setSelectedIds(new Set())} className="p-2 rounded-full hover:bg-white/10" title="Clear Selection"><XIcon className="w-5 h-5"/></button>
                </motion.div>
            )}
            </AnimatePresence>
            
            <div className="flex-1 overflow-auto">
                {renderContent()}
                {sortedAndFilteredEntities.length === 0 && <p className="text-center text-gray-500 py-8">No entities found.</p>}
            </div>

            {totalPages > 1 && viewMode !== 'graph' && (
                <div className="flex justify-between items-center mt-4 text-sm flex-shrink-0">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-700 rounded-md disabled:opacity-50">Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-700 rounded-md disabled:opacity-50">Next</button>
                </div>
            )}
            
            <AnimatePresence>
                {isMergeModalOpen && entitiesToMerge.length === 2 && <MergeConfirmationModal onClose={() => setIsMergeModalOpen(false)} onConfirm={handleConfirmMerge} entitiesToMerge={entitiesToMerge} />}
                {detailPanelEntity && <EntityDetailPanel entity={detailPanelEntity} onClose={() => setDetailPanelEntity(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default EntityHub;