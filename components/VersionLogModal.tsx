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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <CodeIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">سجل التحديثات</h2>
                            <p className="text-sm text-gray-400">تاريخ الإصدارات والمميزات الجديدة</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Version List */}
                    <div className="w-1/3 border-r border-gray-800 bg-gray-950/30 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">جاري التحميل...</div>
                        ) : (
                            <div className="flex flex-col p-2 gap-1">
                                {history.map((version) => (
                                    <button
                                        key={version.id}
                                        onClick={() => setSelectedVersionId(version.id)}
                                        className={`p-3 rounded-lg text-right transition-all duration-200 group ${
                                            selectedVersionId === version.id 
                                            ? 'bg-indigo-600/10 border border-indigo-500/30' 
                                            : 'hover:bg-gray-800/50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-mono font-bold text-sm ${selectedVersionId === version.id ? 'text-indigo-400' : 'text-gray-300'}`}>v{version.version}</span>
                                            {history.indexOf(version) === 0 && (
                                                <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-bold rounded">JADID</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 group-hover:text-gray-400">
                                            {new Date(version.releaseDate).toLocaleDateString('ar-EG')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="w-2/3 bg-gray-900 p-8 overflow-y-auto">
                        {selectedVersion ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-sm text-indigo-300 pb-4 border-b border-gray-800">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>تم الإصدار في {new Date(selectedVersion.releaseDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="prose-custom text-gray-300 leading-relaxed text-right" dir="rtl">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {selectedVersion.changes}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <CodeIcon className="w-12 h-12 mb-4 opacity-20" />
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