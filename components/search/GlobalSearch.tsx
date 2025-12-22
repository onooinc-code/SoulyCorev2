
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, ChatBubbleLeftRightIcon, UsersIcon, LinkIcon, LogIcon, CircleStackIcon } from '../Icons';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';

const sourceIcons: Record<string, React.FC<any>> = {
    'conversation': ChatBubbleLeftRightIcon,
    'contact': UsersIcon,
    'relationship': LinkIcon,
    'archive': LogIcon,
};

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { setActiveView } = useUIState();
    const { setCurrentConversation } = useConversation();
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
        debounceTimeout.current = setTimeout(() => performSearch(query), 400);
        return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
    }, [query, performSearch]);

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-6 border-b border-white/5">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <CircleStackIcon className="w-7 h-7 text-indigo-400" />
                    Cognitive Search
                </h2>
                <p className="text-sm text-gray-400 mt-1">Exploring the nexus of Postgres, Pinecone, EdgeDB, and MongoDB.</p>
                <div className="relative mt-6">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search across all memory dimensions..."
                        className="w-full bg-gray-800 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xl"
                        autoFocus
                    />
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto pt-6 space-y-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-indigo-300 animate-pulse font-mono text-sm">Querying Distributed Memory Tiers...</p>
                    </div>
                )}
                
                <AnimatePresence mode="popLayout">
                    {!isLoading && results.map((result, idx) => {
                        const Icon = sourceIcons[result.type] || CircleStackIcon;
                        return (
                            <motion.div
                                key={result.id + idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-gray-800/40 border border-white/5 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-gray-800"
                                onClick={() => {
                                    if (result.type === 'conversation') {
                                        setCurrentConversation(result.id);
                                        setActiveView('chat');
                                    }
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-gray-900 rounded-lg group-hover:bg-indigo-600 transition-colors">
                                        <Icon className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-gray-100 truncate">{result.title}</h4>
                                            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                                                {result.source}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2">{result.content}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {!isLoading && query.length > 1 && results.length === 0 && (
                    <div className="text-center py-20 text-gray-600">
                        <p className="text-lg font-medium">No matches found in the cognitive nexus.</p>
                        <p className="text-sm mt-1">Try searching for entities, relationships, or archived events.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GlobalSearch;
