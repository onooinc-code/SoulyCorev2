// components/CommandPalette.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';
import { actions, Action } from '@/lib/actionsRegistry';
import { useUIState } from './providers/UIStateProvider';
import { useConversation } from './providers/ConversationProvider';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { 
        setActiveView, 
        setConversationPanelOpen, 
        setLogPanelOpen,
        restartApp,
        exitApp,
        setBookmarksModalOpen,
        setGlobalSettingsModalOpen
    } = useUIState();
    
    const { createNewConversation, clearMessages, currentConversation } = useConversation();

    const handlers: { [key: string]: (arg?: any) => void } = useMemo(() => ({
        'setActiveView': (view) => {
            setActiveView(view);
            onClose();
        },
        'createNewConversation': () => {
            createNewConversation();
            onClose();
        },
        'toggleConversationPanel': () => setConversationPanelOpen(p => !p),
        'clearCurrentConversation': () => {
            if (currentConversation) {
                clearMessages(currentConversation.id);
            }
            onClose();
        },
        'openBookmarks': () => {
            setBookmarksModalOpen(true);
            onClose();
        },
        'openGlobalSettings': () => {
            setGlobalSettingsModalOpen(true);
            onClose();
        },
        'toggleLogPanel': () => {
            setLogPanelOpen(p => !p);
            onClose();
        },
        'restartApp': restartApp, // No need for extra arrow function
        'exitApp': exitApp,       // No need for extra arrow function
    }), [
        setActiveView, createNewConversation, setConversationPanelOpen, 
        clearMessages, currentConversation, setLogPanelOpen, restartApp, 
        exitApp, setBookmarksModalOpen, setGlobalSettingsModalOpen, onClose
    ]);

    const filteredActions = useMemo(() => {
        if (!query) return actions;
        const lowerCaseQuery = query.toLowerCase();
        return actions.filter(
            (action) =>
                action.name.toLowerCase().includes(lowerCaseQuery) ||
                (action.subtitle && action.subtitle.toLowerCase().includes(lowerCaseQuery)) ||
                action.section.toLowerCase().includes(lowerCaseQuery)
        );
    }, [query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredActions]);

    const executeAction = useCallback((action: Action) => {
        const [handlerKey, arg] = action.handlerId.split('-');
        let handler: ((...args: any[]) => void) | undefined;

        if (handlerKey.startsWith('setActiveView')) {
            handler = handlers['setActiveView'];
        } else {
            handler = handlers[handlerKey];
        }
        
        if (handler) {
            handler(arg);
        }
    }, [handlers]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredActions[selectedIndex]) {
                    executeAction(filteredActions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        },
        [isOpen, filteredActions, selectedIndex, executeAction, onClose]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    useEffect(() => {
        if (!isOpen) setQuery('');
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-[100] pt-20 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden border border-indigo-500/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="w-full p-4 bg-transparent text-lg focus:outline-none"
                            autoFocus
                        />
                        <div className="max-h-96 overflow-y-auto border-t border-gray-700">
                            {filteredActions.length > 0 ? (
                                filteredActions.map((action, index) => (
                                    <button
                                        key={action.id}
                                        onClick={() => executeAction(action)}
                                        className={`w-full text-left p-3 flex items-center gap-4 ${
                                            index === selectedIndex ? 'bg-indigo-600' : 'hover:bg-gray-700'
                                        }`}
                                    >
                                        <action.icon className="w-5 h-5 flex-shrink-0" />
                                        <div>
                                            <p>{action.name}</p>
                                            {action.subtitle && (
                                                <p className="text-xs text-gray-400">{action.subtitle}</p>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="p-4 text-center text-gray-500">No actions found.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;