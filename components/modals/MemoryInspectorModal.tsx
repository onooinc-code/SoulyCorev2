
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XIcon, BrainIcon, CircleStackIcon, LinkIcon, ClockIcon, InfoIcon, CheckIcon, ErrorIcon, CommandLineIcon } from '@/components/Icons';
import { useConversation } from '@/components/providers/ConversationProvider';

interface MemoryInspectorModalProps {
    tier: 'semantic' | 'structured' | 'graph' | 'episodic';
    onClose: () => void;
}

const MemoryInspectorModal = ({ tier, onClose }: MemoryInspectorModalProps) => {
    const { memoryMonitor } = useConversation();
    const tierState = memoryMonitor[tier];

    const config = {
        semantic: { label: 'Semantic Memory', icon: BrainIcon, color: 'text-blue-400', source: 'Pinecone (Vector DB)' },
        structured: { label: 'Structured Memory', icon: CircleStackIcon, color: 'text-indigo-400', source: 'Postgres (Entities)' },
        graph: { label: 'Graph Memory', icon: LinkIcon, color: 'text-emerald-400', source: 'EdgeDB (Knowledge Graph)' },
        episodic: { label: 'Episodic Memory', icon: ClockIcon, color: 'text-purple-400', source: 'Postgres (Chat History)' },
    }[tier];

    const statusConfig = {
        idle: { label: 'Idle', icon: InfoIcon, color: 'text-gray-400' },
        executing: { label: 'Querying...', icon: config.icon, color: 'text-yellow-400 animate-pulse' },
        success: { label: 'Retrieval Successful', icon: CheckIcon, color: 'text-green-400' },
        null: { label: 'Query Successful (No Match)', icon: InfoIcon, color: 'text-amber-400' },
        error: { label: 'Retrieval Failed', icon: ErrorIcon, color: 'text-red-400' },
    }[tierState.status];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-white/5 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-white/5 rounded-lg ${config.color}`}>
                            <config.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{config.label} Monitor</h2>
                            <p className="text-[10px] text-gray-500 font-mono">Tier Source: {config.source}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-[60vh]">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <statusConfig.icon className={`w-8 h-8 ${statusConfig.color}`} />
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Last Turn Status</p>
                            <h3 className={`text-xl font-bold ${statusConfig.color}`}>{statusConfig.label}</h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <CommandLineIcon className="w-3.5 h-3.5" />
                            Input Query
                        </h4>
                        <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-sm text-indigo-200">
                            {tierState.query || "No query recorded for this turn."}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Retrieved Content / Metadata</h4>
                        <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-gray-300 min-h-[200px] border border-white/5">
                            {tierState.data ? (
                                <pre className="whitespace-pre-wrap">{JSON.stringify(tierState.data, null, 2)}</pre>
                            ) : tierState.status === 'executing' ? (
                                <span className="italic text-yellow-500/50 animate-pulse">Wait, retrieving from nexus...</span>
                            ) : tierState.status === 'null' ? (
                                <span className="italic text-amber-500/50">Query completed successfully but no relevant results were found for this input.</span>
                            ) : (
                                <span className="italic text-gray-600">No data retrieved in the last turn or tier was not queried.</span>
                            )}
                        </div>
                    </div>

                    {tierState.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <h4 className="text-xs font-bold text-red-400 uppercase mb-1">Retrieval Trace</h4>
                            <p className="text-sm text-red-300/80 font-mono">{tierState.error}</p>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-gray-800/30 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 italic">This data shows the specific context injected from this memory tier into Gemini's prompt.</p>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default MemoryInspectorModal;
