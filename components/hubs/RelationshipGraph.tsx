"use client";

// components/hubs/RelationshipGraph.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { RelationshipGraphData, GraphNode } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { PlusIcon } from '@/components/Icons';
import { AnimatePresence, motion } from 'framer-motion';

const CreateRelationshipModal = ({
    isOpen,
    onClose,
    nodes,
    onSave
}: {
    isOpen: boolean,
    onClose: () => void,
    nodes: GraphNode[],
    onSave: (sourceId: string, targetId: string, predicate: string) => Promise<void>
}) => {
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [predicate, setPredicate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (nodes.length > 0) {
            setSourceId(nodes[0].id);
            setTargetId(nodes[0].id);
        }
    }, [nodes]);

    const handleSave = async () => {
        if (!sourceId || !targetId || !predicate.trim()) return;
        setIsSaving(true);
        await onSave(sourceId, targetId, predicate);
        setIsSaving(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">Create New Relationship</h3>
                        <div className="space-y-4">
                            <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
                            </select>
                            <input value={predicate} onChange={e => setPredicate(e.target.value)} placeholder="Predicate (e.g., 'works_for', 'is_located_in')" className="w-full p-2 bg-gray-700 rounded-md"/>
                            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-green-600 rounded-md disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save Relationship'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const RelationshipGraph = () => {
    const [graphData, setGraphData] = useState<RelationshipGraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchGraphData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/entities/relationships');
            if (!res.ok) throw new Error("Failed to fetch relationship data");
            const data = await res.json();
            setGraphData(data);
        } catch (error) {
            log('Error fetching relationship graph data', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    const handleSaveRelationship = async (sourceId: string, targetId: string, predicate: string) => {
        try {
            const res = await fetch('/api/entities/relationships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_entity_id: sourceId, target_entity_id: targetId, predicate }),
            });
            if (!res.ok) throw new Error("Failed to save relationship");
            addNotification({ type: 'success', title: 'Relationship Created' });
            setIsModalOpen(false);
            await fetchGraphData();
        } catch (error) {
            addNotification({ type: 'error', title: 'Error', message: (error as Error).message });
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center">Loading relationship data...</div>;
    }

    if (!graphData || graphData.nodes.length === 0) {
        return <div className="p-4 text-center">No relationships to display.</div>;
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Entity Relationship Graph</h3>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm">
                    <PlusIcon className="w-5 h-5"/> Create Relationship
                </button>
            </div>
            <div className="flex-1 bg-gray-900/50 p-4 rounded-lg overflow-auto">
                <p>Nodes: {graphData.nodes.length} | Edges: {graphData.edges.length}</p>
                <pre className="text-xs mt-4 max-h-full overflow-auto">
                    {JSON.stringify(graphData, null, 2)}
                </pre>
            </div>
             <p className="text-xs text-gray-500 mt-4 text-center">
                A visual graph component (e.g., using D3 or react-flow) would be implemented here to render this data.
            </p>
            <CreateRelationshipModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                nodes={graphData.nodes}
                onSave={handleSaveRelationship}
            />
        </div>
    );
};

export default RelationshipGraph;