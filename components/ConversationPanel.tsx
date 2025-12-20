
"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { PlusIcon, SparklesIcon, TrashIcon, SearchIcon, XIcon, PinIcon, PinFilledIcon, RefreshIcon, ChatBubbleLeftRightIcon, CpuChipIcon, DocumentTextIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarToolbar from './SidebarToolbar';

// Extend conversation type locally to include stats from the new API
type ConversationWithStats = import('@/lib/types').Conversation & { messageCount?: number; tokenCount?: number };

const ConversationPanel = ({ isMinimized }: { isMinimized: boolean }) => {
    const { 
        conversations, 
        currentConversation, 
        setCurrentConversation, 
        createNewConversation, 
        deleteConversation,
        generateConversationTitle,
        unreadConversations,
        loadConversations,
        isLoading
    } = useConversation();
    
    const { setConversationPanelOpen, isConversationPanelPinned, setIsConversationPanelPinned, isMobileView } = useUIState();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadConversations();
    }, []);

    const handleSelectConversation = (id: string) => {
        setCurrentConversation(id);
        // Automatically close the panel on mobile or if not pinned on desktop
        if (isMobileView || !isConversationPanelPinned) {
            setConversationPanelOpen(false);
        }
    };

    const filteredConversations = (conversations as ConversationWithStats[])
        .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());

    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-white/5 flex-shrink-0 w-full overflow-hidden">
            {/* Header Area */}
            <div className="p-4 flex flex-col gap-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-100">المحادثات</h2>
                    <div className="flex items-center gap-1">
                        <button onClick={() => loadConversations()} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                        {!isMobileView && (
                            <button onClick={() => setIsConversationPanelPinned(!isConversationPanelPinned)} className={`p-2 rounded-lg transition-colors ${isConversationPanelPinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:bg-gray-800'}`}>
                                {isConversationPanelPinned ? <PinFilledIcon className="w-4 h-4" /> : <PinIcon className="w-4 h-4" />}
                            </button>
                        )}
                        <button onClick={() => setConversationPanelOpen(false)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg lg:hidden"><XIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-right text-gray-200 placeholder-gray-500" dir="rtl" />
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2 opacity-60">
                        <ChatBubbleLeftRightIcon className="w-8 h-8" /><span className="text-sm">لا توجد محادثات</span>
                    </div>
                ) : (
                    filteredConversations.map(convo => {
                        const isActive = currentConversation?.id === convo.id;
                        const isUnread = unreadConversations.has(convo.id);
                        
                        return (
                            <div key={convo.id} className="group relative">
                                <button
                                    onClick={() => handleSelectConversation(convo.id)}
                                    className={`w-full text-right p-3 rounded-lg transition-all duration-200 border ${isActive ? 'bg-indigo-600/20 border-indigo-500/50 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-800/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        {isUnread && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />}
                                        <h3 className={`text-sm font-medium truncate w-full pr-1 ${isActive ? 'text-indigo-100' : 'text-gray-300'}`}>{convo.title || 'محادثة جديدة'}</h3>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-gray-500">{new Date(convo.lastUpdatedAt).toLocaleDateString('ar-EG')}</span>
                                        <div className="flex gap-2 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-0.5" title="Messages"><DocumentTextIcon className="w-3 h-3"/> {convo.messageCount || 0}</span>
                                            <span className="flex items-center gap-0.5" title="Tokens"><CpuChipIcon className="w-3 h-3"/> {((convo.tokenCount || 0) / 1000).toFixed(1)}k</span>
                                        </div>
                                    </div>
                                </button>
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-gray-900 shadow-md rounded-md p-0.5 border border-gray-700">
                                    <button onClick={(e) => { e.stopPropagation(); generateConversationTitle(convo.id); }} className="p-1.5 hover:bg-indigo-900/50 text-gray-400 hover:text-indigo-400 rounded transition-colors"><SparklesIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }} className="p-1.5 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-white/5 space-y-2 bg-gray-900 z-10">
                <button onClick={() => { createNewConversation(); if(isMobileView) setConversationPanelOpen(false); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    <PlusIcon className="w-4 h-4" /> محادثة جديدة
                </button>
                <SidebarToolbar isMinimized={isMinimized} />
            </div>
        </div>
    );
};

export default ConversationPanel;
