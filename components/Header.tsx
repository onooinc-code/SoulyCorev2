"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { 
    Bars3Icon, 
    MinusIcon, PlusIcon, RefreshIcon,
    FullscreenIcon, ExitFullscreenIcon,
    CodeIcon,
    CpuChipIcon
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { VersionHistory } from '@/lib/types';
import dynamic from 'next/dynamic';

const VersionLogModal = dynamic(() => import('@/components/VersionLogModal'), { ssr: false });

const VersionSystem = () => {
    const [currentVersion, setCurrentVersion] = useState<VersionHistory | null>(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [hasUnreadUpdate, setHasUnreadUpdate] = useState(false);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch('/api/version/current');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentVersion(data);
                    
                    const lastSeen = typeof window !== 'undefined' ? localStorage.getItem('last_seen_version') : null;
                    if (lastSeen !== data.version) {
                        setHasUnreadUpdate(true);
                    }
                }
            } catch (e) {
                console.error("Version check failed", e);
            }
        };
        checkVersion();
    }, []);

    const handleClick = () => {
        if (currentVersion) {
            localStorage.setItem('last_seen_version', currentVersion.version);
            setHasUnreadUpdate(false);
            setIsLogOpen(true);
        }
    };

    if (!currentVersion) return null;

    return (
        <>
            <button 
                onClick={handleClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-white/10 transition-all group"
            >
                <span className="flex h-2 w-2 relative">
                    {hasUnreadUpdate && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${hasUnreadUpdate ? 'bg-indigo-500' : 'bg-gray-500'}`}></span>
                </span>
                <span className="text-xs font-mono text-gray-400 group-hover:text-gray-200 transition-colors">v{currentVersion.version}</span>
            </button>
            <AnimatePresence>
                {isLogOpen && <VersionLogModal onClose={() => setIsLogOpen(false)} />}
            </AnimatePresence>
        </>
    );
};

const Header = () => {
    const { currentConversation, updateConversationTitle } = useConversation();
    const { setConversationPanelOpen, toggleFullscreen, isFullscreen, restartApp, isMobileView } = useUIState();
    const { changeGlobalFontSize } = useSettings();
    
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => { if (currentConversation) setTitle(currentConversation.title); }, [currentConversation]);

    const handleSave = () => {
        if (currentConversation && title.trim()) updateConversationTitle(currentConversation.id, title.trim());
        setIsEditing(false);
    };

    return (
        <header className="w-full bg-gray-900 border-b border-white/5 flex-shrink-0 z-30">
            <div className="flex items-center justify-between h-14 px-4 w-full">
                {/* Left Section: Logo & Sidebar Toggle */}
                <div className="flex items-center gap-4 min-w-0">
                    <button 
                        onClick={() => setConversationPanelOpen(prev => !prev)} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2 text-gray-200">
                        <CpuChipIcon className="w-5 h-5 text-indigo-500" />
                        <span className="font-bold text-sm tracking-wide hidden sm:inline-block">SOULY<span className="text-gray-500 font-normal">CORE</span></span>
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block"></div>

                    <div className="min-w-0 max-w-md hidden sm:block">
                        {isEditing ? (
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                className="bg-gray-800 text-white rounded px-2 py-1 text-sm font-medium w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                            />
                        ) : (
                            <h1 
                                onClick={() => setIsEditing(true)} 
                                className="text-sm font-medium truncate text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                                title="Click to rename"
                            >
                                {currentConversation?.title || 'New Conversation'}
                            </h1>
                        )}
                    </div>
                </div>

                {/* Right Section: Tools */}
                <div className="flex items-center gap-2">
                    <VersionSystem />
                    
                    {!isMobileView && (
                        <div className="flex items-center bg-gray-800/50 rounded-lg border border-white/5 p-0.5 mx-2">
                            <button onClick={() => changeGlobalFontSize('decrease')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><MinusIcon className="w-3.5 h-3.5" /></button>
                            <div className="w-px h-3 bg-white/10 mx-0.5"></div>
                            <button onClick={() => changeGlobalFontSize('increase')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><PlusIcon className="w-3.5 h-3.5" /></button>
                        </div>
                    )}
                    
                    <button 
                        onClick={toggleFullscreen} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <ExitFullscreenIcon className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
                    </button>
                    
                    <button 
                        onClick={restartApp} 
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Restart App"
                    >
                        <RefreshIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;