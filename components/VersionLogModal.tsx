"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ClockIcon, CodeIcon, SparklesIcon, CheckIcon, WrenchScrewdriverIcon } from './Icons';
import type { VersionHistory } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VersionLogModalProps {
    onClose: () => void;
}

type Tab = 'timeline' | 'stats';

const VersionLogModal = ({ onClose }: VersionLogModalProps) => {
    const [history, setHistory] = useState<VersionHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('timeline');
    const [filter, setFilter] = useState<'all' | 'features' | 'fixes'>('all');

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

    const processContent = (content: string) => {
        // Simple heuristic to highlight different types of changes based on keywords
        if (filter === 'all') return content;
        
        const lines = content.split('\n');
        const filteredLines = lines.filter(line => {
            const lowerLine = line.toLowerCase();
            if (filter === 'features') return lowerLine.includes('new:') || lowerLine.includes('feature') || lowerLine.includes('add');
            if (filter === 'fixes') return lowerLine.includes('fix') || lowerLine.includes('bug') || lowerLine.includes('resolve');
            return true;
        });
        
        return filteredLines.length > 0 ? filteredLines.join('\n') : '_No items match this filter._';
    };

    const stats = useMemo(() => {
        if (!history.length) return null;
        const totalUpdates = history.length;
        const firstUpdate = new Date(history[history.length - 1].releaseDate);
        const lastUpdate = new Date(history[0].releaseDate);
        const daysSpan = Math.max(1, Math.ceil((lastUpdate.getTime() - firstUpdate.getTime()) / (1000 * 60 * 60 * 24)));
        const velocity = (totalUpdates / daysSpan).toFixed(1); // Updates per day

        return { totalUpdates, daysSpan, velocity, lastUpdateDate: lastUpdate.toLocaleDateString() };
    }, [history]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CodeIcon className="w-6 h-6 text-indigo-500" />
                            System Changelog
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Tracking the evolution of SoulyCore.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs & Filters */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/30">
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setActiveTab('timeline')} 
                            className={`text-sm font-medium transition-colors ${activeTab === 'timeline' ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Timeline
                        </button>
                         <button 
                            onClick={() => setActiveTab('stats')} 
                            className={`text-sm font-medium transition-colors ${activeTab === 'stats' ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Velocity Stats
                        </button>
                    </div>
                    
                    {activeTab === 'timeline' && (
                        <div className="flex gap-2">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>All</button>
                            <button onClick={() => setFilter('features')} className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'features' ? 'bg-indigo-900/50 text-indigo-300' : 'text-gray-500 hover:bg-gray-800'}`}>Features ✨</button>
                            <button onClick={() => setFilter('fixes')} className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'fixes' ? 'bg-red-900/50 text-red-300' : 'text-gray-500 hover:bg-gray-800'}`}>Fixes 🐛</button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500 animate-pulse">Loading version history...</p>
                        </div>
                    ) : activeTab === 'timeline' ? (
                        <div className="relative space-y-8 pl-8 before:content-[''] before:absolute before:left-[27px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-gray-700 before:to-transparent">
                            {history.map((item, index) => {
                                const isLatest = index === 0;
                                const date = new Date(item.releaseDate);
                                return (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative"
                                    >
                                        {/* Dot on Timeline */}
                                        <div className={`absolute -left-[39px] top-1.5 w-4 h-4 rounded-full border-2 ${isLatest ? 'bg-indigo-500 border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gray-900 border-gray-600'}`}></div>
                                        
                                        <div className={`p-5 rounded-xl border transition-all ${isLatest ? 'bg-indigo-900/10 border-indigo-500/30 shadow-lg' : 'bg-gray-800/40 border-gray-700/50'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className={`text-xl font-bold font-mono ${isLatest ? 'text-indigo-300' : 'text-gray-300'}`}>v{item.version}</h3>
                                                        {isLatest && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-sm">Latest</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        <span>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="prose-custom text-sm text-gray-300">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{processContent(item.changes)}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                                <SparklesIcon className="w-10 h-10 text-indigo-400 mb-4" />
                                <h3 className="text-3xl font-bold text-white">{stats?.totalUpdates}</h3>
                                <p className="text-gray-400 text-sm">Total Updates Released</p>
                            </div>
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                                <ClockIcon className="w-10 h-10 text-green-400 mb-4" />
                                <h3 className="text-3xl font-bold text-white">{stats?.daysSpan}</h3>
                                <p className="text-gray-400 text-sm">Days of Active Development</p>
                            </div>
                             <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                                <WrenchScrewdriverIcon className="w-10 h-10 text-yellow-400 mb-4" />
                                <h3 className="text-3xl font-bold text-white">{stats?.velocity}</h3>
                                <p className="text-gray-400 text-sm">Updates Per Day (Avg)</p>
                            </div>
                             <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                                <CheckIcon className="w-10 h-10 text-blue-400 mb-4" />
                                <h3 className="text-lg font-bold text-white">{stats?.lastUpdateDate}</h3>
                                <p className="text-gray-400 text-sm">Last Update Date</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default VersionLogModal;