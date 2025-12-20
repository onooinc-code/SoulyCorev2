
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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-5xl h-[85vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gray-800/50">
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
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Version List (RTL) */}
                    <div className="w-1/3 border-r border-white/5 bg-black/20 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm animate-pulse">جاري التحميل...</div>
                        ) : (
                            <div className="flex flex-col p-3 gap-2">
                                {history.map((version) => (
                                    <button
                                        key={version.id}
                                        onClick={() => setSelectedVersionId(version.id)}
                                        className={`p-4 rounded-xl text-right transition-all duration-200 group relative overflow-hidden ${
                                            selectedVersionId === version.id 
                                            ? 'bg-indigo-600/20 border border-indigo-500/30 shadow-lg' 
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1 relative z-10">
                                            <span className={`font-mono font-bold text-sm ${selectedVersionId === version.id ? 'text-indigo-300' : 'text-gray-300'}`}>v{version.version}</span>
                                            {history.indexOf(version) === 0 && (
                                                <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-bold rounded-full shadow-lg shadow-indigo-500/40">JADID</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 group-hover:text-gray-400 relative z-10">
                                            {new Date(version.releaseDate).toLocaleDateString('ar-EG')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area (LTR for Technical English) */}
                    <div className="w-2/3 bg-gray-900 p-8 overflow-y-auto">
                        {selectedVersion ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-end gap-2 text-sm text-indigo-300/80 pb-4 border-b border-white/5" dir="rtl">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>تم الإصدار في {new Date(selectedVersion.releaseDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                
                                {/* 
                                    CRITICAL CHANGE: Added 'dir-ltr' class and forced 'text-left' and 'direction: ltr' 
                                    style to properly render the markdown changelog which is in English.
                                */}
                                <div className="prose-custom text-gray-300 leading-relaxed text-left" style={{ direction: 'ltr', textAlign: 'left' }} dir="ltr">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {selectedVersion.changes}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
                                <CodeIcon className="w-16 h-16 opacity-10" />
                                <p>اختر إصداراً لعرض التفاصيل</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VersionLogModal;
