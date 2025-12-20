"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { 
    SparklesIcon, EditIcon, TrashIcon, Bars3Icon, LogIcon, 
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

const VersionLogModal = dynamic(() => import('@/components/VersionLogModal'), { ssr: false });

const VersionCard = () => {
    const [currentVersion, setCurrentVersion] = useState<VersionHistory | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);

    useEffect(() => {
        fetch('/api/version/current').then(res => res.ok && res.json()).then(data => data && setCurrentVersion(data));
    }, []);

    if (!currentVersion) return null;

    return (
        <>
            <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className="relative hidden md:block">
                <div onClick={() => setIsLogOpen(true)} className="px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer bg-gray-800 text-gray-400 hover:text-indigo-400 transition-colors">
                    v{currentVersion.version}
                </div>
                <AnimatePresence>
                    {isHovered && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-64 glass-panel rounded-lg shadow-2xl p-4 z-50">
                            <h4 className="font-bold text-white text-xs">اصدار {currentVersion.version}</h4>
                            <div className="prose-custom text-[10px] max-h-40 overflow-y-auto mt-2">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentVersion.changes}</ReactMarkdown>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {isLogOpen && <VersionLogModal onClose={() => setIsLogOpen(false)} />}
        </>
    );
};

const Header = () => {
    const { currentConversation, deleteConversation, updateConversationTitle, generateConversationTitle } = useConversation();
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
                    <VersionCard />
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