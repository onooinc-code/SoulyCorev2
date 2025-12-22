
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XIcon, WrenchScrewdriverIcon, InfoIcon, CheckIcon, ErrorIcon } from '@/components/Icons';
import { useConversation } from '@/components/providers/ConversationProvider';

interface ToolInspectorModalProps {
    onClose: () => void;
}

const ToolInspectorModal = ({ onClose }: ToolInspectorModalProps) => {
    const { toolState } = useConversation();

    const statusConfig = {
        idle: { label: 'Idle', icon: InfoIcon, color: 'text-gray-400' },
        executing: { label: 'Executing...', icon: WrenchScrewdriverIcon, color: 'text-yellow-400' },
        success: { label: 'Tool Result Success', icon: CheckIcon, color: 'text-green-400' },
        error: { label: 'Tool Execution Error', icon: ErrorIcon, color: 'text-red-400' },
    };

    const config = statusConfig[toolState.status];

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
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <WrenchScrewdriverIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Live Tool Monitor</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <config.icon className={`w-8 h-8 ${config.color}`} />
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Status</p>
                            <h3 className={`text-xl font-bold ${config.color}`}>{config.label}</h3>
                        </div>
                    </div>

                    {toolState.toolName && (
                        <div className="space-y-2">
                             <h4 className="text-xs font-bold text-gray-400 uppercase">Active Tool</h4>
                             <p className="text-lg font-mono text-indigo-300 bg-black/40 px-3 py-1.5 rounded-lg border border-indigo-500/20">{toolState.toolName}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Inputs / Arguments</h4>
                            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-gray-300 h-40 overflow-auto border border-white/5">
                                {toolState.input ? (
                                    <pre>{JSON.stringify(toolState.input, null, 2)}</pre>
                                ) : (
                                    <span className="italic text-gray-600">No input data.</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Output / Observation</h4>
                            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-emerald-400/80 h-40 overflow-auto border border-white/5">
                                {toolState.output ? (
                                    <pre>{JSON.stringify(toolState.output, null, 2)}</pre>
                                ) : (
                                    <span className="italic text-gray-600">Waiting for observation...</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {toolState.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <h4 className="text-xs font-bold text-red-400 uppercase mb-1">Error Trace</h4>
                            <p className="text-sm text-red-300/80 font-mono">{toolState.error}</p>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-gray-800/30 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 italic">This monitor tracks real-time Gemini function calling interactions.</p>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default ToolInspectorModal;
