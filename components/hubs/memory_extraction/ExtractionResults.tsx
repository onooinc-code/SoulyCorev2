"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';
import { EntityDefinition } from '@/lib/types';
import { BrainIcon, LightbulbIcon, LinkIcon, ArrowDownOnSquareIcon } from '@/components/Icons';

interface ExtractedData {
    entities: any[];
    knowledge: string[];
    relationships: any[];
}

interface ExtractionResultsProps {
    data: ExtractedData | null;
}

const ExtractionResults = ({ data }: ExtractionResultsProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    const handleSave = async () => {
        if (!data) return;
        setIsSaving(true);
        addNotification({ type: 'info', title: 'Saving to Memory...', message: 'This may take a moment.' });
        try {
            // 1. Save all entities and collect their returned objects (with IDs)
            const savedEntities: EntityDefinition[] = await Promise.all(data.entities.map(async (entity) => {
                const res = await fetch('/api/entities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entity),
                });
                if (!res.ok) throw new Error(`Failed to save entity: ${entity.name}`);
                return res.json();
            }));

            const entityMap = new Map(savedEntities.map(e => [e.name.toLowerCase(), e.id]));

            // 2. Save all knowledge snippets
            await Promise.all(data.knowledge.map(async (snippet) => {
                const res = await fetch('/api/knowledge/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: snippet }),
                });
                if (!res.ok) console.warn(`Failed to save knowledge snippet: ${snippet}`);
            }));

            // 3. Save all relationships using the IDs from the saved entities
            await Promise.all(data.relationships.map(async (rel) => {
                const sourceId = entityMap.get(rel.source.toLowerCase());
                const targetId = entityMap.get(rel.target.toLowerCase());
                if (sourceId && targetId) {
                    const res = await fetch('/api/entities/relationships', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sourceEntityId: sourceId, targetEntityId: targetId, predicate: rel.predicate }),
                    });
                     if (!res.ok) console.warn(`Failed to save relationship: ${rel.source} -> ${rel.target}`);
                }
            }));
            
            addNotification({ type: 'success', title: 'Memory Updated', message: 'Extracted information has been saved.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Save Failed', message: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    if (!data) return null;

    const hasData = data.entities.length > 0 || data.knowledge.length > 0 || data.relationships.length > 0;

    return (
        <div className="p-4 space-y-4">
            <AnimatePresence>
                {hasData && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500 disabled:opacity-50"
                        >
                            <ArrowDownOnSquareIcon className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save All to Memory'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {data.entities.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-2"><BrainIcon className="w-5 h-5"/> Entities</h3>
                    <div className="space-y-2">
                        {data.entities.map((e, i) => (
                            <div key={i} className="bg-gray-700 p-3 rounded-md text-sm">
                                <p><strong>{e.name}</strong> ({e.type})</p>
                                <p className="text-xs text-gray-400 mt-1">{e.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {data.knowledge.length > 0 && (
                 <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-2"><LightbulbIcon className="w-5 h-5"/> Knowledge Snippets</h3>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                        {data.knowledge.map((k, i) => <li key={i} className="bg-gray-700 p-2 rounded-md">{k}</li>)}
                    </ul>
                </div>
            )}
            {data.relationships.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 font-semibold mb-2"><LinkIcon className="w-5 h-5"/> Relationships</h3>
                     <div className="space-y-1 text-sm font-mono">
                        {data.relationships.map((r, i) => (
                            <div key={i} className="bg-gray-700 p-2 rounded-md">
                                <span className="text-blue-400">{r.source}</span>
                                <span className="text-gray-400"> --[{r.predicate}]--> </span>
                                <span className="text-green-400">{r.target}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtractionResults;
