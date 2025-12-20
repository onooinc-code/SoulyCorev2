
"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { 
    Bars3Icon, 
    MinusIcon, PlusIcon, RefreshIcon,
    FullscreenIcon, ExitFullscreenIcon,
    CpuChipIcon,
    CodeIcon, DashboardIcon, SearchIcon, UsersIcon, 
    BrainIcon, RocketLaunchIcon, CircleStackIcon
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
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300"
            >
                <div className="relative flex h-2 w-2">
                    {hasUnreadUpdate && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${hasUnreadUpdate ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                </div>
                <span className="text-[10px] font-mono font-medium text-gray-400 group-hover:text-gray-200 transition-colors tracking-wider">v{currentVersion.version}</span>
            </button>
            <AnimatePresence>
                {isLogOpen && <VersionLogModal onClose={() => setIsLogOpen(false)} />}
            </AnimatePresence>
        </>
    );
};

const Header = () => {
    const { currentConversation, updateConversationTitle } = useConversation();
    const { setConversationPanelOpen, toggleFullscreen, isFullscreen, restartApp, isMobileView, activeView } = useUIState();
    const { changeGlobalFontSize } = useSettings();
    
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => { if (currentConversation) setTitle(currentConversation.title); }, [currentConversation]);

    const handleSave = () => {
        if (currentConversation && title.trim()) updateConversationTitle(currentConversation.id, title.trim());
        setIsEditing(false);
    };

    const getViewTitle = () => {
        switch (activeView) {
            case 'chat': return currentConversation?.title || 'محادثة جديدة';
            case 'dashboard': return 'لوحة التحكم الرئيسية (Dashboard)';
            case 'agent_center': return 'غرفة عمليات الوكيل (Agent Center)';
            case 'dev_center': return 'مركز المطورين (Dev Center)';
            case 'brain_center': return 'إدارة العقل (Brain Center)';
            case 'search': return 'البحث الشامل';
            case 'contacts_hub': return 'سجل جهات الاتصال';
            case 'data_hub': return 'مركز البيانات';
            default: return activeView.replace('_', ' ').toUpperCase();
        }
    };

    const getViewIcon = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardIcon className="w-5 h-5 text-indigo-400" />;
            case 'search': return <SearchIcon className="w-5 h-5 text-indigo-400" />;
            case 'agent_center': return <RocketLaunchIcon className="w-5 h-5 text-orange-400" />;
            case 'dev_center': return <CodeIcon className="w-5 h-5 text-green-400" />;
            case 'brain_center': return <BrainIcon className="w-5 h-5 text-pink-400" />;
            case 'contacts_hub': return <UsersIcon className="w-5 h-5 text-blue-400" />;
            case 'data_hub': return <CircleStackIcon className="w-5 h-5 text-yellow-400" />;
            default: return <CpuChipIcon className="w-5 h-5 text-indigo-400" />;
        }
    };

    return (
        <header className="absolute top-0 left-0 right-0 z-30 h-16 flex-shrink-0">
            {/* Glass Background Layer */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl border-b border-white/5 shadow-sm"></div>

            <div className="relative h-full flex items-center justify-between px-4 w-full max-w-[1920px] mx-auto">
                {/* Left Section: Branding & Toggle */}
                <div className="flex items-center gap-4 min-w-0">
                    <button 
                        onClick={() => setConversationPanelOpen(prev => !prev)} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>
                    
                    <div className="hidden md:flex items-center gap-2 select-none">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                            {getViewIcon()}
                        </div>
                        <span className="font-bold text-sm tracking-wide text-gray-200">SOULY<span className="text-gray-600 font-light">CORE</span></span>
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-2 hidden md:block"></div>

                    {/* Title Area - Dynamic based on View */}
                    <div className="min-w-0 max-w-md">
                        {activeView === 'chat' ? (
                            isEditing ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="bg-gray-800/50 text-white rounded-lg px-3 py-1 text-sm font-medium w-full focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-indigo-500/30 transition-all text-right"
                                    autoFocus
                                    dir="rtl"
                                />
                            ) : (
                                <h1 
                                    onClick={() => setIsEditing(true)} 
                                    className="text-sm font-medium truncate text-gray-300 hover:text-white cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                                    title="انقر لإعادة التسمية"
                                >
                                    {getViewTitle()}
                                </h1>
                            )
                        ) : (
                            <h1 className="text-sm font-bold text-gray-200 px-2 flex items-center gap-2">
                                {getViewTitle()}
                            </h1>
                        )}
                    </div>
                </div>

                {/* Right Section: Controls */}
                <div className="flex items-center gap-3">
                    <VersionSystem />
                    
                    {!isMobileView && (
                        <div className="flex items-center bg-white/5 rounded-full border border-white/5 p-0.5 mx-2">
                            <button onClick={() => changeGlobalFontSize('decrease')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><MinusIcon className="w-3 h-3" /></button>
                            <div className="w-px h-3 bg-white/10 mx-1"></div>
                            <button onClick={() => changeGlobalFontSize('increase')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><PlusIcon className="w-3 h-3" /></button>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={toggleFullscreen} 
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <ExitFullscreenIcon className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
                        </button>
                        
                        <button 
                            onClick={restartApp} 
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Restart System"
                        >
                            <RefreshIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
