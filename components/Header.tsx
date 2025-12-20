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
    ArrowDownOnSquareIcon
} from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import ToolbarButton from './ToolbarButton';
import type { VersionHistory } from '@/lib/types';
import dynamic from 'next/dynamic';

const VersionLogModal = dynamic(() => import('@/components/VersionLogModal'), { ssr: false });

const VersionSystem = () => {
    const [currentVersion, setCurrentVersion] = useState<VersionHistory | null>(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [hasUnreadUpdate, setHasUnreadUpdate] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
            setIsHovered(false);
        }
    };

    if (!currentVersion) return null;

    return (
        <div className="relative z-50">
            <button 
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative group hidden md:flex items-center justify-center px-3 py-1 rounded-full bg-gray-800 border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-700 transition-all cursor-pointer mr-2"
            >
                <CodeIcon className="w-3.5 h-3.5 text-gray-400 mr-2 group-hover:text-indigo-400" />
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">
                    v{currentVersion.version}
                </span>
                
                {hasUnreadUpdate && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
                )}
            </button>

            {/* Hover Card for Quick View */}
            <AnimatePresence>
                {isHovered && !isLogOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-72 bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl overflow-hidden pointer-events-none"
                    >
                        <div className="p-4 border-b border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-indigo-400">Latest Update</span>
                                <span className="text-[10px] text-gray-500">{new Date(currentVersion.releaseDate).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-gray-300 line-clamp-4 leading-relaxed">
                                {currentVersion.changes.replace(/^- /gm, '').substring(0, 150)}...
                            </div>
                        </div>
                        <div className="bg-gray-900/50 px-4 py-2 text-[10px] text-gray-500 flex justify-between items-center">
                            <span>Click to view full changelog</span>
                            <ArrowDownOnSquareIcon className="w-3 h-3" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Modal */}
            <AnimatePresence>
                {isLogOpen && <VersionLogModal onClose={() => setIsLogOpen(false)} />}
            </AnimatePresence>
        </div>
    );
};

const Header = () => {
    const { currentConversation, updateConversationTitle } = useConversation();
    const { setConversationPanelOpen, isMobileView, toggleFullscreen, isFullscreen, restartApp } = useUIState();
    const { changeGlobalFontSize } = useSettings();
    
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => { if (currentConversation) setTitle(currentConversation.title); }, [currentConversation]);

    const handleSave = () => {
        if (currentConversation && title.trim()) updateConversationTitle(currentConversation.id, title.trim());
        setIsEditing(false);
    };

    return (
        <header className="relative w-full glass-panel z-30 px-4 py-2 border-b border-white/5 flex-shrink-0 safe-top">
            <div className="flex items-center justify-between w-full max-w-5xl mx-auto gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setConversationPanelOpen(prev => !prev)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg">
                        <Bars3Icon className="w-5 h-5" />
                    </button>
                    
                    <div className="min-w-0">
                        {isEditing ? (
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                className="bg-gray-800 text-white rounded-md px-2 py-0.5 text-sm font-bold w-full"
                                autoFocus
                            />
                        ) : (
                            <h1 onClick={() => setIsEditing(true)} className="text-sm font-bold truncate text-gray-200 cursor-pointer hover:text-indigo-400">
                                {currentConversation?.title || 'محادثة جديدة'}
                            </h1>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <VersionSystem />
                    <div className="w-px h-4 bg-white/10 mx-1 hidden md:block"></div>
                    
                    {!isMobileView && (
                        <>
                            <ToolbarButton onClick={() => changeGlobalFontSize('decrease')} title="تصغير الخط" color="gray"><MinusIcon className="w-4 h-4" /></ToolbarButton>
                            <ToolbarButton onClick={() => changeGlobalFontSize('increase')} title="تكبير الخط" color="gray"><PlusIcon className="w-4 h-4" /></ToolbarButton>
                        </>
                    )}
                    
                    <ToolbarButton onClick={toggleFullscreen} title="ملء الشاشة" color="gray">
                        {isFullscreen ? <ExitFullscreenIcon className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
                    </ToolbarButton>
                    
                    <ToolbarButton onClick={restartApp} title="اعادة التشغيل" color="yellow"><RefreshIcon className="w-4 h-4" /></ToolbarButton>
                </div>
            </div>
        </header>
    );
};

export default Header;