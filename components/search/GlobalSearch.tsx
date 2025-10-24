
"use client";

// components/search/GlobalSearch.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, UsersIcon } from '../Icons';
import type { SearchResult } from '@/app/api/search/route';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';

const resultIcons: Record<SearchResult['type'], React.FC<any>> = {
    conversation: ChatBubbleLeftRightIcon,
    message: DocumentTextIcon,
    contact: UsersIcon,
};

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { setActiveView } = useUIState();
    const { setCurrentConversation, setScrollToMessageId } = useConversation();
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> to avoid using a Node.js-specific type in client-side code.
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const performSearch = useCallback(async (searchTerm: string) => {
        if (searchTerm.trim().length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            performSearch(query);
        }, 300);
    }, [query, performSearch]);

    const handleResultClick = (result: SearchResult) => {
        if (result.type === 'conversation') {
            setCurrentConversation(result.id);
            setActiveView('chat');
        } else if (result.type === 'message') {
            const conversationId = result.url.split('/')[2].split('#')[0];
            setCurrentConversation(conversationId);
            setScrollToMessageId(result.id);
            setActiveView('chat');
        } else if (result.type === 'contact') {
            setActiveView('contacts_hub');
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Global Search</h2>
                <div className="relative mt-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search across conversations, messages, contacts, and memory..."
                        className="w-full bg-gray-800 rounded-lg pl-10 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto pt-6">
                {isLoading && <p className="text-center text-gray-400">Searching...</p>}
                {!isLoading && results.length > 0 && (
                    <div className="space-y-3">
                        {results.map(result => {
                            const Icon = resultIcons[result.type];
                            return (
                                <motion.button
                                    key={result.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <Icon className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-200 truncate">{result.title}</p>
                                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                                <span className="capitalize bg-gray-700 px-2 py-0.5 rounded-full">{result.type}</span>
                                                {result.parentTitle && <span>{result.parentTitle}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
                {!isLoading && query.length > 1 && results.length === 0 && (
                    <p className="text-center text-gray-500">No results found for "{query}".</p>
                )}
            </main>
        </div>
    );
};

export default GlobalSearch;