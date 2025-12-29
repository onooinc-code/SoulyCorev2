
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CodeIcon, ClockIcon, CheckIcon } from './Icons';
import type { VersionHistory } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MotionDiv = motion.div as any;

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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <MotionDiv
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-5xl h-[85vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[10000]"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gray-800/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/20 shadow-inner">
                            <CodeIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">سجل التحديثات</h2>
                            <p className="text-xs text-gray-400 mt-1">تاريخ الإصدارات والمميزات الجديدة</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 border border-white/5"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Version List (RTL) */}
                    <div className="w-1/3 border-r border-white/5 bg-black/20 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm animate-pulse">جاري التحميل...</div>
                        ) : (
                            <div className="flex flex-col p-3 gap-2">
                                {history.map((version, idx) => (
                                    <button
                                        key={version.id}
                                        onClick={() => setSelectedVersionId(version.id)}
                                        className={`p-4 rounded-xl text-right transition-all duration-200 group relative overflow-hidden flex flex-col gap-1 ${
                                            selectedVersionId === version.id 
                                            ? 'bg-indigo-600/20 border border-indigo-500/30 shadow-lg' 
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full relative z-10">
                                            <span className={`font-mono font-bold text-sm ${selectedVersionId === version.id ? 'text-indigo-300' : 'text-gray-300'}`}>v{version.version}</span>
                                            {idx === 0 && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">
                                                    <CheckIcon className="w-3 h-3" /> LATEST
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 group-hover:text-gray-400 relative z-10">
                                            {new Date(version.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area (Forced LTR for technical English logs) */}
                    <div className="w-2/3 bg-gray-900 p-8 overflow-y-auto custom-scrollbar relative">
                        {selectedVersion ? (
                            <div className="max-w-3xl mx-auto">
                                <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                                     <div className="flex items-center gap-2 text-sm text-gray-400" dir="ltr">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>Released on {new Date(selectedVersion.releaseDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <span className="font-mono text-2xl font-bold text-indigo-400">v{selectedVersion.version}</span>
                                </div>
                                
                                {/* Content Renderer */}
                                <div className="prose-custom text-gray-300 leading-relaxed text-left" style={{ direction: 'ltr', textAlign: 'left' }} dir="ltr">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {selectedVersion.changes}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
                                <CodeIcon className="w-16 h-16 opacity-10" />
                                <p>Select a version to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </MotionDiv>
        </div>
    );
};

export default VersionLogModal;
