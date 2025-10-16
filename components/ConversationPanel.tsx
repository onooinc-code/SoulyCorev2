"use client";

import React, { useState, useMemo } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from './providers/UIStateProvider';
import { PlusIcon, SparklesIcon, EditIcon, TrashIcon, SearchIcon, XIcon, SidebarLeftIcon } from '@/components/Icons';
import { useLog } from './providers/LogProvider';
import { AnimatePresence, motion } from 'framer-motion';
import type { Conversation } from '@/lib/types';
import SidebarToolbar from './SidebarToolbar';

// Helper function to format relative dates
const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const getGroupKey = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const aWeekAgo = new Date(today);
    aWeekAgo.setDate(aWeekAgo.getDate() - 7);
    const aMonthAgo = new Date(today);
    aMonthAgo.setMonth(aMonthAgo.getMonth() - 1);

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) return 'Today';
    if (checkDate.getTime() === yesterday.getTime()) return 'Yesterday';
    if (checkDate > aWeekAgo) return 'Previous 7 Days';
    if (checkDate > aMonthAgo) return 'Previous 30 Days';
    return 'Older';
};

interface ConversationPanelProps {
    isMinimized: boolean;
}


const ConversationPanel = ({ isMinimized }: ConversationPanelProps) => {
    const { 
        conversations, 
        currentConversation, 
        setCurrentConversation, 
        createNewConversation, 
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
        isLoading,
        unreadConversations,
    } = useConversation();
    const { setConversationPanelOpen, setIsConversationPanelMinimized } = useUIState();
    const { log } = useLog();
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleNewChat = () => {
        log('User clicked "New Chat" button.');
        createNewConversation();
    };
    
    const handleSetConversation = (id: string) => {
        if (editingConversationId === id) return;
        log('User selected a conversation.', { conversationId: id });
        setCurrentConversation(id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation and all its messages?')) {
            deleteConversation(id);
        }
    };

    const handleGenerateTitle = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        generateConversationTitle(id);
    };
    
    const handleEditTitle = (e: React.MouseEvent, id: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingConversationId(id);
        setEditingTitle(currentTitle);
    };

    const handleSaveTitle = (id: string) => {
        if (editingTitle.trim()) {
            updateConversationTitle(id, editingTitle.trim());
        }
        setEditingConversationId(null);
        setEditingTitle('');
    };
    
    const groupedAndFilteredConversations = useMemo(() => {
        const filtered = searchTerm
            ? conversations.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
            : conversations;

        return filtered.reduce((acc, convo) => {
            const groupKey = getGroupKey(new Date(convo.lastUpdatedAt));
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(convo);
            return acc;
        }, {} as Record<string, Conversation[]>);
    }, [conversations, searchTerm]);

    const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];

    return (
        <div className="flex flex-col h-full bg-gray-800 p-3 overflow-hidden border-r border-gray-700/50">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    {!isMinimized && <h2 className="text-lg font-semibold">Conversations</h2>}
                     <div className="flex items-center gap-1">
                        <button onClick={() => setIsConversationPanelMinimized(!isMinimized)} className="p-2 text-gray-400 hover:text-white" title={isMinimized ? "Expand Panel" : "Minimize Panel"}>
                            <SidebarLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`} />
                        </button>
                        <button onClick={() => setConversationPanelOpen(false)} className="p-2 text-gray-400 hover:text-white" title="Close Panel">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {!isMinimized && (
                    <div className="relative mb-4">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <AnimatePresence>
                {groupOrder.map(group => (
                    groupedAndFilteredConversations[group] && (
                        <motion.div key={group} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {!isMinimized && <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider my-2 px-2">{group}</h2>}
                            <ul className="space-y-1">
                                {groupedAndFilteredConversations[group].map(convo => {
                                    const isUnread = unreadConversations.has(convo.id);
                                    const isProcessing = isLoading && currentConversation?.id === convo.id;

                                    return (
                                        <li key={convo.id} className="relative group">
                                            {editingConversationId === convo.id && !isMinimized ? (
                                                <div className="flex items-center">
                                                    <input
                                                        type="text"
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        onBlur={() => handleSaveTitle(convo.id)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(convo.id)}
                                                        className="w-full p-2 rounded-md text-sm bg-gray-600 text-white outline-none ring-2 ring-indigo-500"
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSetConversation(convo.id)}
                                                    className={`w-full text-left p-2 rounded-md text-sm flex items-center justify-between ${currentConversation?.id === convo.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="w-2 h-2 flex-shrink-0 self-center rounded-full" style={{
                                                            backgroundColor: isProcessing ? '#818cf8' : isUnread ? '#818cf8' : 'transparent',
                                                            animation: isProcessing ? 'pulse 1.5s infinite' : 'none'
                                                        }}></span>
                                                        {!isMinimized && <span className="truncate flex-1 font-medium text-gray-200">{convo.title}</span>}
                                                    </div>
                                                    {!isMinimized && (
                                                        <>
                                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2 group-hover:hidden">
                                                                {getRelativeTime(new Date(convo.lastUpdatedAt))}
                                                            </span>
                                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-full">
                                                                <button onClick={(e) => handleGenerateTitle(e, convo.id)} className="p-1.5 text-gray-300 hover:text-indigo-400" title="Generate new title"><SparklesIcon className="w-4 h-4" /></button>
                                                                <button onClick={(e) => handleEditTitle(e, convo.id, convo.title)} className="p-1.5 text-gray-300 hover:text-blue-400" title="Rename"><EditIcon className="w-4 h-4" /></button>
                                                                <button onClick={(e) => handleDelete(e, convo.id)} className="p-1.5 text-gray-300 hover:text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                                            </div>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </motion.div>
                    )
                ))}
                </AnimatePresence>
            </div>
            <SidebarToolbar isMinimized={isMinimized} />
        </div>
    );
};

export default ConversationPanel;