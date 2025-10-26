

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from './Icons';
import type { VersionHistory } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VersionLogModalProps {
    onClose: () => void;
}

const VersionLogModal = ({ onClose }: VersionLogModalProps) => {
    const [history, setHistory] = useState<VersionHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[150] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-lg shadow-2xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-xl font-bold">Version History</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {isLoading ? (
                        <p className="text-gray-400">Loading history...</p>
                    ) : (
                        history.map(item => (
                            <div key={item.id} className="border-b border-gray-700/50 pb-4 last:border-b-0">
                                <div className="flex items-baseline gap-4">
                                    <h3 className="text-lg font-bold text-indigo-300">v{item.version}</h3>
                                    <p className="text-sm text-gray-500">{new Date(item.release_date).toLocaleDateString()}</p>
                                </div>
                                <div className="prose-custom text-sm mt-2">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.changes}</ReactMarkdown>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default VersionLogModal;
