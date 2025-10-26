
"use client";

// components/CommandPalette.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon } from './Icons';
import { actions, Action } from '@/lib/actionsRegistry';
import { useUIState } from './providers/UIStateProvider';
import { useConversation } from './providers/ConversationProvider';

interface CommandPaletteProps {
    onClose: () => void;
}

const CommandPalette = ({ onClose }: CommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { 
        setActiveView, 
        setConversationPanelOpen, 
        setLogPanelOpen,
        restartApp,
        exitApp,
        setBookmarksModalOpen,
        setGlobalSettingsModalOpen,
        setShortcutsModalOpen,
        setAddKnowledgeModalOpen,
        setResponseViewerModalOpen,
        setCommandPaletteOpen,
    } = useUIState();
    
    const { createNewConversation, clearMessages, currentConversation } = useConversation();

    const handlers: { [key: string]: () => void } = useMemo(() => ({
        // Navigation handlers are dynamic
        'createNewConversation': createNewConversation,
        'toggleConversationPanel': () => setConversationPanelOpen(p => !p),
        'clearCurrentConversation': () => {
            if (currentConversation) {
                clearMessages(currentConversation.id);
            }
        },
        'openAddKnowledge': () => setAddKnowledgeModalOpen(true),
        'openBookmarks': () => setBookmarksModalOpen(true),
        'openCommandPalette': () => setCommandPaletteOpen(true),
        'openGlobalSettings': () => setGlobalSettingsModalOpen(true),
        'openShortcuts': () => setShortcutsModalOpen(true),
        'toggleLogPanel': () => setLogPanelOpen(p => !p),
        'openResponseViewer': () => setResponseViewerModalOpen(true),
        'restartApp': restartApp,
        'exitApp': exitApp,
    }), [
        createNewConversation, setConversationPanelOpen, currentConversation, clearMessages,
        setAddKnowledgeModalOpen, setBookmarksModalOpen, setCommandPaletteOpen, 
        setGlobalSettingsModalOpen, setShortcutsModalOpen, setLogPanelOpen, 
        setResponseViewerModalOpen, restartApp, exitApp
    ]);

    const executeAction = useCallback((action: Action) => {
        const [handlerKey, arg] = action.handlerId.split('-');
        
        if (handlerKey === 'setActiveView' && arg) {
            setActiveView(arg as any);
        } else {
            const handler = handlers[handlerKey];
            if (handler) {
                handler();
            } else {
                console.warn(`No handler found for action: ${action.handlerId}`);
            }
        }
        onClose();
    }, [handlers, setActiveView, onClose]);


    const filteredActions = useMemo(() => {
        const availableActions = actions.filter(action => {
            if (action.handlerId === 'clearCurrentConversation' && !currentConversation) {
                return false;
            }
            return true;
        });

        if (!query) return availableActions;
        const lowerCaseQuery = query.toLowerCase();
        return availableActions.filter(
            (action) =>
                action.name.toLowerCase().includes(lowerCaseQuery) ||
                (action.subtitle && action.subtitle.toLowerCase().includes(lowerCaseQuery)) ||
                action.section.toLowerCase().includes(lowerCaseQuery)
        );
    }, [query, currentConversation]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredActions]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (filteredActions.length === 0) return;

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
            }
        },
        [filteredActions, selectedIndex, executeAction, onClose]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    useEffect(() => {
        const selectedElement = document.getElementById(`command-item-${selectedIndex}`);
        selectedElement?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const groupedActions = useMemo(() => {
        return filteredActions.reduce((acc, action) => {
            (acc[action.section] = acc[action.section] || []).push(action);
            return acc;
        }, {} as Record<string, Action[]>);
    }, [filteredActions]);
    
    const sectionOrder: Action['section'][] = ['Navigation', 'Conversation', 'Data', 'Application'];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-[100] pt-[15vh] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="glass-panel rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative flex items-center">
                    <SearchIcon className="w-5 h-5 absolute left-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type a command or search..."
                        className="w-full pl-12 p-4 bg-transparent text-lg focus:outline-none"
                        autoFocus
                    />
                </div>
                <div id="command-list" className="max-h-96 overflow-y-auto border-t border-gray-700">
                    {filteredActions.length > 0 ? (
                        sectionOrder.map(section => groupedActions[section] && (
                            <div key={section} className="p-2">
                                <p className="text-xs font-semibold text-gray-500 px-3 py-1">{section}</p>
                                {groupedActions[section].map((action) => {
                                    const index = filteredActions.indexOf(action);
                                    return (
                                        <button
                                            key={action.id}
                                            id={`command-item-${index}`}
                                            onClick={() => executeAction(action)}
                                            className={`w-full text-left p-3 flex items-center gap-4 rounded-md ${
                                                index === selectedIndex ? 'bg-indigo-600' : 'hover:bg-gray-700/50'
                                            }`}
                                        >
                                            <action.icon className="w-5 h-5 flex-shrink-0 text-gray-300" />
                                            <div>
                                                <p className="text-gray-100">{action.name}</p>
                                                {action.subtitle && (
                                                    <p className="text-xs text-gray-400">{action.subtitle}</p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-500">No actions found.</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CommandPalette;
