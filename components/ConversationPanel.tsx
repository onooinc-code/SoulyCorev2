"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { PlusIcon, SparklesIcon, TrashIcon, SearchIcon, XIcon, PinIcon, PinFilledIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
import type { Conversation } from '@/lib/types';
import SidebarToolbar from './SidebarToolbar';

const normalizeDate = (dateInput: Date | string): Date => {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? new Date() : date;
};

const getRelativeTime = (dateInput: Date | string): string => {
    const date = normalizeDate(dateInput);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    if (seconds < 60) return 'الآن';
    if (minutes < 60) return `منذ ${minutes}د`;
    if (hours < 24) return `منذ ${hours}س`;
    return date.toLocaleDateString('ar-EG');
};

const getGroupKey = (dateInput: Date | string): string => {
    const date = normalizeDate(dateInput);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) return 'اليوم';
    if (checkDate.getTime() === yesterday.getTime()) return 'أمس';
    return 'سابقاً';
};

const ConversationPanel = ({ isMinimized }: { isMinimized: boolean }) => {
    const { 
        conversations, 
        currentConversation, 
        setCurrentConversation, 
        createNewConversation, 
        deleteConversation,
        generateConversationTitle,
        unreadConversations,
        loadConversations // Ensure we can force load
    } = useConversation();
    
    const { setConversationPanelOpen, isConversationPanelPinned, setIsConversationPanelPinned, isMobileView } = useUIState();
    const [searchTerm, setSearchTerm] = useState('');

    // Force load on mount to ensure data exists
    useEffect(() => {
        loadConversations();
    }, []);

    const groupedConversations = useMemo(() => {
        const filtered = searchTerm
            ? conversations.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
            : conversations;

        // Add sorting by lastUpdatedAt desc to ensure order is correct before grouping
        const sorted = [...filtered].sort((a, b) => 
            new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
        );

        return sorted.reduce((acc, convo) => {
            const groupKey = getGroupKey(convo.lastUpdatedAt);
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(convo);
            return acc;
        }, {} as Record<string, Conversation[]>);
    }, [conversations, searchTerm]);

    const groupOrder = ['اليوم', 'أمس', 'سابقاً'];

    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-white/5 flex-shrink-0 w-full overflow-hidden">
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-100">المحادثات</h2>
                    <div className="flex items-center gap-1">
                        {!isMobileView && (
                            <button 
                                onClick={() => setIsConversationPanelPinned(!isConversationPanelPinned)}
                                className={`p-2 rounded-lg transition-colors ${isConversationPanelPinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:bg-gray-800'}`}
                            >
                                {isConversationPanelPinned ? <PinFilledIcon className="w-4 h-4" /> : <PinIcon className="w-4 h-4" />}
                            </button>
                        )}
                        <button onClick={() => setConversationPanelOpen(false)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="بحث في المحادثات..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-right"
                        dir="rtl"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6 scrollbar-hide">
                {conversations.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 text-sm">
                        لا توجد محادثات سابقة.
                    </div>
                ) : (
                    groupOrder.map(group => groupedConversations[group]?.length > 0 && (
                        <div key={group} className="space-y-1">
                            <h3 className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 text-right">{group}</h3>
                            {groupedConversations[group].map(convo => {
                                const isActive = currentConversation?.id === convo.id;
                                const isUnread = unreadConversations.has(convo.id);
                                
                                return (
                                    <motion.div key={convo.id} className="relative group/item px-1">
                                        <button
                                            onClick={() => {
                                                setCurrentConversation(convo.id);
                                                if (isMobileView) setConversationPanelOpen(false);
                                            }}
                                            className={`w-full text-right p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 ${
                                                isActive ? 'bg-indigo-600/15 border border-indigo-500/30' : 'hover:bg-gray-800/50 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-end gap-2 mb-0.5">
                                                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-300' : 'text-gray-200'}`}>
                                                        {convo.title}
                                                    </p>
                                                    {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                                </div>
                                                <p className="text-[10px] text-gray-500">{getRelativeTime(convo.lastUpdatedAt)}</p>
                                            </div>
                                        </button>
                                        
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1 bg-gray-800/80 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg z-10">
                                            <button onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }} className="p-1.5 hover:text-red-400 transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); generateConversationTitle(convo.id); }} className="p-1.5 hover:text-indigo-400 transition-colors"><SparklesIcon className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-white/5 space-y-2">
                <button
                    onClick={createNewConversation}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <PlusIcon className="w-4 h-4" />
                    محادثة جديدة
                </button>
                <SidebarToolbar isMinimized={isMinimized} />
            </div>
        </div>
    );
};

export default ConversationPanel;