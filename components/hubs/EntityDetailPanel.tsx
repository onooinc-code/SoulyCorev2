"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import type { EntityDefinition } from '@/lib/types';

interface EntityDetailPanelProps {
    entity: EntityDefinition;
    onClose: () => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h5>
        <div className="text-sm text-gray-300 mt-1">{value}</div>
    </div>
);

const EntityDetailPanel = ({ entity, onClose }: EntityDetailPanelProps) => {
    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-full max-w-md bg-gray-800/80 backdrop-blur-md border-l border-white/10 shadow-2xl z-30 flex flex-col"
        >
            <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="font-bold text-lg">{entity.name}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
            </header>
            <main className="p-6 overflow-y-auto space-y-6">
                <DetailRow label="Type" value={<span className="font-mono bg-gray-700 px-2 py-0.5 rounded-md">{entity.type}</span>} />
                <DetailRow label="Description" value={<p className="whitespace-pre-wrap">{entity.description || <i className="text-gray-500">No description provided.</i>}</p>} />
                <DetailRow label="Aliases" value={
                    Array.isArray(entity.aliases) && entity.aliases.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {entity.aliases.map(alias => <span key={alias} className="bg-gray-700 px-2 py-1 rounded-full text-xs">{alias}</span>)}
                        </div>
                    ) : <i className="text-gray-500">No aliases.</i>
                } />
                <DetailRow label="Tags" value={
                    Array.isArray(entity.tags) && entity.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {entity.tags.map(tag => <span key={tag} className="bg-gray-700 px-2 py-1 rounded-full text-xs">#{tag}</span>)}
                        </div>
                    ) : <i className="text-gray-500">No tags.</i>
                } />
                <div className="border-t border-gray-700 pt-4">
                     <DetailRow label="Relationships" value={<i className="text-gray-500">Relationship data loading is planned for a future update.</i>} />
                </div>
                 <div>
                     <DetailRow label="Associated Messages" value={<i className="text-gray-500">Message association is planned for a future update.</i>} />
                </div>
                 <div>
                     <DetailRow label="Edit History" value={<i className="text-gray-500">Audit trail is planned for a future update.</i>} />
                </div>
            </main>
            <footer className="p-4 border-t border-gray-700 mt-auto text-xs text-gray-500">
                <p>ID: {entity.id}</p>
                <p>Last Updated: {new Date(entity.lastUpdatedAt).toLocaleString()}</p>
            </footer>
        </motion.div>
    );
};

export default EntityDetailPanel;