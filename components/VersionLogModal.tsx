"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon, ClockIcon, CodeIcon } from './Icons';
import type { VersionHistory } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VersionLogModalProps {
    onClose: () => void;
}

const VersionLogModal = ({ onClose }: VersionLogModalProps) => {
    const [history, setHistory] = useState<VersionHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/version/history');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Failed to fetch version history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[250] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CodeIcon className="w-6 h-6 text-indigo-500" />
                            System Changelog
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Update History & Release Notes</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 relative bg-gray-900">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500 animate-pulse">Loading version history...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative pl-8 before:content-[''] before:absolute before:left-[27px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-800">
                            {history.map((item, index) => {
                                const isLatest = index === 0;
                                const date = new Date(item.releaseDate);
                                return (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative"
                                    >
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[39px] top-1.5 w-4 h-4 rounded-full border-2 ${isLatest ? 'bg-indigo-500 border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gray-900 border-gray-600'}`}></div>
                                        
                                        <div className={`p-5 rounded-xl border transition-all ${isLatest ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-gray-800/40 border-gray-700/50'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className={`text-xl font-bold font-mono ${isLatest ? 'text-indigo-300' : 'text-gray-300'}`}>v{item.version}</h3>
                                                        {isLatest && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-sm">Latest</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        <span>{date.toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="prose-custom text-sm text-gray-300 max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.changes}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default VersionLogModal;