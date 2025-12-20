"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CodeIcon, ClockIcon } from './Icons';
import type { VersionHistory } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VersionLogModalProps {
    onClose: () => void;
}

const VersionLogModal = ({ onClose }: VersionLogModalProps) => {
    const [history, setHistory] = useState<VersionHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/version/history');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                    if (data.length > 0) {
                        setSelectedVersionId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch version history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const selectedVersion = history.find(v => v.id === selectedVersionId);

    // Using z-[9999] to ensure it is above absolutely everything
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] max-h-[800px] flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <CodeIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">System Updates</h2>
                            <p className="text-xs text-gray-400">Track changes and new features</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Version List */}
                    <div className="w-1/3 border-r border-gray-800 bg-gray-900/50 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-6 text-center text-gray-500">Loading...</div>
                        ) : (
                            <div className="flex flex-col">
                                {history.map((version) => (
                                    <button
                                        key={version.id}
                                        onClick={() => setSelectedVersionId(version.id)}
                                        className={`p-4 text-left border-b border-gray-800 transition-colors hover:bg-gray-800/80 ${
                                            selectedVersionId === version.id ? 'bg-gray-800 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${selectedVersionId === version.id ? 'text-white' : 'text-gray-300'}`}>v{version.version}</span>
                                            {history.indexOf(version) === 0 && (
                                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">LATEST</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">{new Date(version.releaseDate).toLocaleDateString()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="w-2/3 bg-gray-900 p-6 overflow-y-auto">
                        {selectedVersion ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 border-b border-gray-800 pb-4">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>Released on {new Date(selectedVersion.releaseDate).toLocaleString()}</span>
                                </div>
                                <div className="prose-custom text-gray-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {selectedVersion.changes}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Select a version to view details.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default VersionLogModal;