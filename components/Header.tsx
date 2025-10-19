

"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from './providers/ConversationProvider';
// FIX: Corrected relative import paths for the UIState provider and icon components to use the absolute path alias `@`, resolving module resolution errors during the build process.
import { useUIState } from '@/components/providers/UIStateProvider';
// FIX: Corrected import path for useSettings.
import { useSettings } from '@/components/providers/SettingsProvider';
// FIX: Corrected relative import paths for the UIState provider and icon components to use the absolute path alias `@`, resolving module resolution errors during the build process.
import { 
    SparklesIcon, EditIcon, TrashIcon, SidebarLeftIcon, LogIcon, 
    MinusIcon, PlusIcon, PowerIcon, RefreshIcon,
    FullscreenIcon, ExitFullscreenIcon 
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import ToolbarButton from './ToolbarButton';
import type { VersionHistory } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { useNotification } from '@/lib/hooks/use-notifications';

const VersionLogModal = dynamic(() => import('./VersionLogModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Version History...</p></div>
});


const VersionCard = () => {
    const [currentVersion, setCurrentVersion] = useState<VersionHistory | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const res = await fetch('/api/version/current');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentVersion(data);
                    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
                    if (lastSeenVersion !== data.version) {
                        setIsNew(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch current version", error);
            }
        };
        fetchVersion();
    }, []);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (isNew && currentVersion) {
            localStorage.setItem('lastSeenVersion', currentVersion.version);
            setIsNew(false);
        }
    };

    if (!currentVersion) return null;

    const isToday = new Date(currentVersion.release_date).toDateString() === new Date().toDateString();

    return (
        <>
            <motion.div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
                className="relative"
            >
                <div 
                    onClick={() => setIsLogOpen(true)}
                    className={`relative px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-300 ${isToday ? 'bg-indigo-600/80 text-indigo-100' : 'bg-gray-700/80 text-gray-300'}`}
                >
                    v{currentVersion.version}
                    {isNew && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    )}
                </div>
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-2 w-72 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-4 z-20"
                        >
                            <h4 className="font-bold text-white">Version {currentVersion.version}</h4>
                            <p className="text-xs text-gray-400 mb-2">Released: {new Date(currentVersion.release_date).toLocaleDateString()}</p>
                            <div className="prose-custom text-xs max-h-40 overflow-y-auto pr-2">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentVersion.changes}</ReactMarkdown>
                            </div>
                            <button onClick={() => setIsLogOpen(true)} className="mt-3 w-full text-center text-xs text-indigo-300 hover:underline">View Full History</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <VersionLogModal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
        </>
    );
};


const Header = () => {
    const { 
        currentConversation, 
        deleteConversation,
        updateConversationTitle,
        generateConversationTitle,
        loadConversations,
    } = useConversation();
    const {
        isConversationPanelOpen,
        setConversationPanelOpen,
        setLogPanelOpen,
        restartApp,
        exitApp,
        isFullscreen,
        toggleFullscreen,
    } = useUIState();
    const { changeGlobalFontSize } = useSettings();
    const { addNotification } = useNotification();

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (currentConversation) {
            setTitle(currentConversation.title);
        }
    }, [currentConversation]);

    const handleEdit = () => {
        if (!currentConversation) return;
        setIsEditing(true);
    };

    const handleSave = () => {
        if (currentConversation && title.trim()) {
            updateConversationTitle(currentConversation.id, title.trim());
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (currentConversation && window.confirm('Are you sure you want to delete this conversation?')) {
            deleteConversation(currentConversation.id);
        }
    };
    
    const handleGenerateTitle = () => {
        if (currentConversation) {
            generateConversationTitle(currentConversation.id);
        }
    };

    const handleSoftRefresh = async () => {
        await loadConversations();
        addNotification({
            type: 'success',
            title: 'Data Synced',
            message: 'Your conversation list has been refreshed from the server.'
        });
    };

    return (
        <motion.header 
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="relative w-full glass-panel z-10 p-2 border-b border-gray-700/50 flex-shrink-0"
        >
            <div 
                className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                style={{
                    animation: 'move-glow 4s linear infinite'
                }}
            ></div>

            <div className="flex items-center justify-between w-full max-w-4xl mx-auto gap-4">
                {!isConversationPanelOpen && (
                    <div className="flex-shrink-0">
                        <ToolbarButton onClick={() => setConversationPanelOpen(true)} title="Show Sidebar" color="gray">
                            <SidebarLeftIcon className="w-5 h-5 transform rotate-180" />
                        </ToolbarButton>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div key="editing-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="w-full bg-gray-700 text-white rounded-md px-2 py-1 text-lg font-semibold"
                                    autoFocus
                                />
                            </motion.div>
                        ) : (
                            <motion.h1 
                                key="display-title" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="text-lg font-semibold truncate text-gray-200 cursor-pointer"
                                onDoubleClick={handleEdit}
                                title="Double-click to rename"
                            >
                                {currentConversation?.title || 'New Conversation'}
                            </motion.h1>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex items-center justify-end gap-2 flex-shrink-0">
                    <VersionCard />
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    {currentConversation && (
                        <>
                            <ToolbarButton onClick={handleGenerateTitle} title="Generate new title with AI" color="purple">
                                <SparklesIcon className="w-5 h-5" />
                            </ToolbarButton>
                            <ToolbarButton onClick={handleEdit} title="Rename conversation" color="blue">
                                <EditIcon className="w-5 h-5" />
                            </ToolbarButton>
                            <ToolbarButton onClick={handleDelete} title="Delete conversation" color="red">
                                <TrashIcon className="w-5 h-5" />
                            </ToolbarButton>
                            <div className="w-px h-6 bg-gray-600 mx-1"></div>
                        </>
                    )}
                    <ToolbarButton onClick={() => changeGlobalFontSize('decrease')} title="Decrease font size" color="gray">
                        <MinusIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => changeGlobalFontSize('increase')} title="Increase font size" color="gray">
                        <PlusIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => setLogPanelOpen(prev => !prev)} title="Toggle Log Panel" color="cyan">
                        <LogIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    <ToolbarButton onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} color="lime">
                        {isFullscreen ? <ExitFullscreenIcon className="w-5 h-5" /> : <FullscreenIcon className="w-5 h-5" />}
                    </ToolbarButton>
                     <ToolbarButton onClick={handleSoftRefresh} title="Soft Refresh (Sync data)" color="cyan">
                        <RefreshIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={restartApp} title="Hard Refresh" color="yellow">
                        <RefreshIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={exitApp} title="Exit App" color="red">
                        <PowerIcon className="w-5 h-5" />
                    </ToolbarButton>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;