
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MagnifyingGlassIcon } from './Icons';
import type { Action } from '@/lib/actionsRegistry';
import type { Message } from '@/lib/types';
import { useLog } from './providers/LogProvider';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    actions: Action[];
    setCurrentConversation: (conversationId: string | null) => void;
    setScrollToMessageId: (messageId: string | null) => void;
}

interface MessageSearchResult extends Message {
    conversationTitle: string;
}

const CommandPalette = ({ isOpen, onClose, actions, setCurrentConversation, setScrollToMessageId }: CommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [messageResults, setMessageResults] = useState<MessageSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const { log } = useLog();
    const inputRef = useRef<HTMLInputElement>(null);
    const activeItemRef = useRef<HTMLLIElement>(null);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setQuery('');
            setMessageResults([]);
        }
    }, [isOpen]);

    const performTagSearch = useCallback(async (tagQuery: string) => {
        if (!tagQuery) {
            setMessageResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        log('Searching messages by tag', { tagQuery });
        try {
            const res = await fetch(`/api/messages/search-by-tag?q=${encodeURIComponent(tagQuery)}`);
            if (!res.ok) throw new Error('Tag search failed');
            const data: MessageSearchResult[] = await res.json();
            setMessageResults(data);
        } catch (error) {
            log('Tag search failed', { error }, 'error');
            setMessageResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [log]);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        if (query.startsWith('#')) {
            const tagQuery = query.substring(1);
            setIsSearching(true);
            debounceTimeout.current = setTimeout(() => performTagSearch(tagQuery), 300);
        } else {
            setMessageResults([]);
        }
    }, [query, performTagSearch]);


    const filteredStaticActions = useMemo(() => {
        const lowerQuery = query.toLowerCase();
        return query.startsWith('#') || !query
            ? actions
            : actions.filter(action =>
                action.name.toLowerCase().includes(lowerQuery) ||
                action.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
            );
    }, [actions, query]);

    const groupedStaticActions = useMemo(() => {
        return filteredStaticActions.reduce<Record<string, Action[]>>((acc, action) => {
            const group = action.group;
            if (!acc[group]) acc[group] = [];
            acc[group].push(action);
            return acc;
        }, {});
    }, [filteredStaticActions]);
    
    const flatActionList = useMemo(() => {
        const staticActions = Object.values(groupedStaticActions).flat();
        return [...messageResults, ...staticActions];
    }, [groupedStaticActions, messageResults]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query, messageResults]);

     useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % flatActionList.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + flatActionList.length) % flatActionList.length);
        } else if (e.key === 'Enter' && flatActionList[selectedIndex]) {
            e.preventDefault();
            const selectedItem = flatActionList[selectedIndex];
            if ('action' in selectedItem) { // It's a static Action
                selectedItem.action();
            } else { // It's a MessageSearchResult
                setCurrentConversation(selectedItem.conversationId);
                setScrollToMessageId(selectedItem.id);
            }
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-[100] p-4 pt-[15vh]" onClick={onClose}>
                    <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl flex flex-col border border-indigo-500/30" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 p-3 border-b border-gray-700">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search actions or type '#' to search messages by tag..." className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"/>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                             {isSearching ? <p className="text-center text-gray-400 p-4">Searching...</p> : 
                             flatActionList.length > 0 ? (
                                <>
                                    {messageResults.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 px-3 pt-3 pb-1">Message Results</h3>
                                            <ul>{messageResults.map((msg, index) => {
                                                const isSelected = index === selectedIndex;
                                                return (<li key={msg.id} ref={isSelected ? activeItemRef : null} onClick={() => { setCurrentConversation(msg.conversationId); setScrollToMessageId(msg.id); onClose(); }} className={`p-3 rounded-md cursor-pointer text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}><p className="font-semibold truncate">{msg.content}</p><p className="text-xs opacity-70">in: {msg.conversationTitle}</p></li>);
                                            })}</ul>
                                        </div>
                                    )}
                                    {!query.startsWith('#') && Object.keys(groupedStaticActions).map(group => (
                                        <div key={group}>
                                            <h3 className="text-xs font-semibold text-gray-500 px-3 pt-3 pb-1">{group}</h3>
                                            <ul>{groupedStaticActions[group].map(action => {
                                                const currentIndex = flatActionList.findIndex(a => 'id' in a && a.id === action.id);
                                                const isSelected = currentIndex === selectedIndex;
                                                const Icon = action.icon;
                                                return (<li key={action.id} ref={isSelected ? activeItemRef : null} onClick={() => { action.action(); onClose(); }} className={`flex items-center gap-3 p-3 rounded-md cursor-pointer text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}><Icon className="w-5 h-5" /><span>{action.name}</span></li>);
                                            })}</ul>
                                        </div>
                                    ))}
                                </>
                            ) : <p className="text-center text-gray-500 p-8">No results found.</p>}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
