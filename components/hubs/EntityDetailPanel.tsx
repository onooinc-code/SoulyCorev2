"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon, ClockIcon, SparklesIcon } from '../Icons';
import type { EntityDefinition, EntityHistoryLog } from '@/lib/types';
import { useNotification } from '@/lib/hooks/use-notifications';

interface EntityDetailPanelProps {
    entity: EntityDefinition;
    onClose: () => void;
    onRefresh: () => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h5>
        <div className="text-sm text-gray-300 mt-1">{value}</div>
    </div>
);

// FIX: Added a props interface and typed the component as a React.FC to resolve the type error with the 'key' prop.
interface HistoryRowProps {
    log: EntityHistoryLog;
}

const HistoryRow: React.FC<HistoryRowProps> = ({ log }) => {
    const renderValue = (value: string | undefined | null) => {
        if (!value || value === 'null' || value === '[]') return <i className="text-gray-500">empty</i>;
        try {
            const arr = JSON.parse(value);
            if (Array.isArray(arr) && arr.length > 0) {
                return <div className="flex flex-wrap gap-1">{arr.map((item, i) => <span key={i} className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">{String(item)}</span>)}</div>
            }
            if (Array.isArray(arr) && arr.length === 0) {
                 return <i className="text-gray-500">empty array</i>;
            }
        } catch (e) {}
        return <p className="whitespace-pre-wrap font-mono text-gray-400 bg-gray-900/50 p-1 rounded">{value}</p>;
    };

    return (
        <div className="text-sm p-3 bg-gray-900/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-200 capitalize">{log.fieldName} changed</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {new Date(log.changedAt).toLocaleString()}
                </span>
            </div>
            <div className="pl-4 border-l-2 border-gray-700 space-y-2">
                <div>
                    <span className="text-xs text-red-400">FROM: </span>
                    {renderValue(log.oldValue)}
                </div>
                 <div>
                    <span className="text-xs text-green-400">TO: </span>
                    {renderValue(log.newValue)}
                </div>
            </div>
        </div>
    )
};

const EntityDetailPanel = ({ entity, onClose, onRefresh }: EntityDetailPanelProps) => {
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [history, setHistory] = useState<EntityHistoryLog[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (activeTab === 'history' && entity) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const res = await fetch(`/api/entities/${entity.id}/history`);
                    if (!res.ok) throw new Error('Failed to fetch history');
                    const data = await res.json();
                    setHistory(data);
                } catch (error) {
                    console.error("History fetch error:", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [activeTab, entity]);

    const handleAiSummarize = async () => {
        if (!entity) return;
        setIsSummarizing(true);
        addNotification({ type: 'info', title: 'AI Summarization', message: 'Generating a new summary for this entity...' });
        try {
            const res = await fetch(`/api/entities/${entity.id}/summarize`, {
                method: 'POST'
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to generate summary.");
            }
            addNotification({ type: 'success', title: 'Summary Updated', message: 'The entity description has been updated.' });
            onRefresh(); // Trigger a refresh in the parent component
        } catch (error) {
            addNotification({ type: 'error', title: 'Summarization Failed', message: (error as Error).message });
        } finally {
            setIsSummarizing(false);
        }
    };

    const TabButton = ({ tab, label }: { tab: 'details' | 'history', label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
        >
            {label}
        </button>
    );

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
                <div className="flex items-center gap-2">
                    <button onClick={handleAiSummarize} disabled={isSummarizing} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-xs rounded-md hover:bg-blue-500 disabled:opacity-50">
                        <SparklesIcon className="w-4 h-4" />
                        {isSummarizing ? 'Summarizing...' : 'AI Summarize'}
                    </button>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
            </header>
            
            <nav className="flex-shrink-0 border-b border-gray-700 flex gap-4 px-4">
                <TabButton tab="details" label="Details" />
                <TabButton tab="history" label="History" />
            </nav>

            <main className="p-6 overflow-y-auto space-y-6">
                {activeTab === 'details' && (
                    <>
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
                    </>
                )}
                {activeTab === 'history' && (
                    isLoadingHistory ? (
                        <p className="text-gray-400">Loading history...</p>
                    ) : history.length > 0 ? (
                        <div className="space-y-4">
                            {history.map(log => <HistoryRow key={log.id} log={log} />)}
                        </div>
                    ) : (
                        <p className="text-gray-500">No changes have been recorded for this entity.</p>
                    )
                )}
            </main>
            <footer className="p-4 border-t border-gray-700 mt-auto text-xs text-gray-500">
                <p>ID: {entity.id}</p>
                <p>Last Updated: {new Date(entity.lastUpdatedAt).toLocaleString()}</p>
            </footer>
        </motion.div>
    );
};

export default EntityDetailPanel;