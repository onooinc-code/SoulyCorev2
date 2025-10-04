
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MagnifyingGlassIcon } from './Icons';
import type { Action } from '@/lib/actionsRegistry';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    actions: Action[];
}

const CommandPalette = ({ isOpen, onClose, actions }: CommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const filteredAndGroupedActions = useMemo(() => {
        const lowerQuery = query.toLowerCase();
        const itemsToGroup = !query
            ? actions
            : actions.filter(action =>
                action.name.toLowerCase().includes(lowerQuery) ||
                action.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
            );

        // FIX: Explicitly type the accumulator in the reduce function to ensure correct type inference.
        // This resolves the error where `actions.map` was called on an 'unknown' type.
        return itemsToGroup.reduce((acc: Record<string, Action[]>, action) => {
            if (!acc[action.group]) acc[action.group] = [];
            acc[action.group].push(action);
            return acc;
        }, {} as Record<string, Action[]>);
    }, [actions, query]);

    const flatActionList = useMemo(() => {
        return Object.values(filteredAndGroupedActions).flat();
    }, [filteredAndGroupedActions]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

     useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                block: 'nearest',
            });
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
            flatActionList[selectedIndex].action();
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-[100] p-4 pt-[15vh]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl flex flex-col border border-indigo-500/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 p-3 border-b border-gray-700">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search for actions..."
                                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                            />
                        </div>
                        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
                             {flatActionList.length > 0 ? (
                                Object.entries(filteredAndGroupedActions).map(([group, actionsInGroup]) => (
                                    <div key={group}>
                                        <h3 className="text-xs font-semibold text-gray-500 px-3 pt-3 pb-1">{group}</h3>
                                        <ul>
                                            {actionsInGroup.map(action => {
                                                const currentIndex = flatActionList.findIndex(a => a.id === action.id);
                                                const isSelected = currentIndex === selectedIndex;
                                                const Icon = action.icon;
                                                
                                                return (
                                                    <li
                                                        key={action.id}
                                                        ref={isSelected ? activeItemRef : null}
                                                        onClick={() => { action.action(); onClose(); }}
                                                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                        <span>{action.name}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 p-8">No actions found.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;