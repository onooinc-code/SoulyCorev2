
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/lib/types';
import { useLog } from './providers/LogProvider';
import { motion } from 'framer-motion';
import { UserCircleIcon, CpuChipIcon } from './Icons';

interface ConversationSearchProps {
    conversationId: string;
    onJumpToMessage: (messageId: string) => void;
}

const ConversationSearch = ({ conversationId, onJumpToMessage }: ConversationSearchProps) => {
    const { log } = useLog();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [results, setResults] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const performSearch = useCallback(async (query: string, tags: string[]) => {
        setIsLoading(true);
        log('Performing search in conversation', { query, tags });
        try {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            if (tags.length > 0) params.set('tags', tags.join(','));

            const res = await fetch(`/api/conversations/${conversationId}/search?${params.toString()}`);
            if (!res.ok) throw new Error('Search request failed');
            const data = await res.json();
            setResults(data.messages || []);
            setAvailableTags(data.availableTags || []);
        } catch (error) {
            log('Search failed', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, log]);

    useEffect(() => {
        // Initial fetch to get available tags
        performSearch('', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);
    
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            performSearch(searchTerm, selectedTags);
        }, 300); // 300ms debounce

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [searchTerm, selectedTags, performSearch]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {availableTags.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Filter by Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-600 hover:bg-gray-500'}`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {isLoading ? (
                    <p className="text-center text-gray-400 py-4">Searching...</p>
                ) : results.length > 0 ? (
                    results.map(message => (
                        <motion.button
                            key={message.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => onJumpToMessage(message.id)}
                            className="w-full text-left p-2 bg-gray-900/50 hover:bg-gray-900 rounded-md"
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-1">
                                    {message.role === 'user' ? <UserCircleIcon className="w-4 h-4 text-gray-400" /> : <CpuChipIcon className="w-4 h-4 text-indigo-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-300 truncate">{message.content}</p>
                                    <span className="text-xs text-gray-500">{new Date(message.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.button>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-4">No results found.</p>
                )}
            </div>
        </div>
    );
};

export default ConversationSearch;
