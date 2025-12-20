"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/Sidebar';
import { useUIState } from '@/components/providers/UIStateProvider';
import { AnimatePresence, motion } from 'framer-motion';
import NavigationRail from './NavigationRail';
import MobileBottomNav from './MobileBottomNav';
import ActiveViewRenderer from './views/ActiveViewRenderer';
import { useAppContextMenu } from '@/lib/hooks/useAppContextMenu';
import ContextMenu from './ContextMenu';
import GlobalModals from './modals/GlobalModals';
import MorningBriefing from './MorningBriefing';
import UniversalProgressIndicator from './UniversalProgressIndicator';
import AppStatusBar from './AppStatusBar';
import TopProgressBar from './TopProgressBar';
import Notifications from './Notifications';
import { useConversation } from './providers/ConversationProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import EmptyState from './ui/EmptyState';
import { ChatBubbleLeftRightIcon } from './Icons';

export const App = () => {
    const { 
        isConversationPanelOpen, 
        setConversationPanelOpen,
        isConversationPanelMinimized,
        activeView,
        setCommandPaletteOpen,
        isMobileView,
    } = useUIState();

    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();
    const { currentConversation, backgroundTaskCount, createNewConversation } = useConversation();
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);

    const shortcuts = useMemo(() => ({
        'mod+k': () => setCommandPaletteOpen(prev => !prev),
    }), [setCommandPaletteOpen]);
    useKeyboardShortcuts(shortcuts);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('lastVisit');
        if (lastVisit !== today) {
            const timer = setTimeout(() => setIsBriefingOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const renderMainContent = () => {
        if (activeView === 'chat') {
            if (currentConversation) return <ChatWindow />;
            return (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <EmptyState
                        icon={ChatBubbleLeftRightIcon}
                        title="ابدأ محادثة جديدة"
                        description="اختر محادثة من القائمة الجانبية أو ابدأ واحدة جديدة الآن."
                        action={{ label: 'محادثة جديدة', onClick: createNewConversation }}
                    />
                </div>
            );
        }
        return <ActiveViewRenderer />;
    };

    return (
        <main
            className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100"
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <AnimatePresence>{backgroundTaskCount > 0 && <UniversalProgressIndicator />}</AnimatePresence>
            
            {/* Desktop Side Navigation */}
            {!isMobileView && <NavigationRail />}
            
            <div className="flex-1 flex flex-row min-w-0 h-full relative">
                {/* Conversation List / Sidebar */}
                <AnimatePresence mode="wait">
                    {isConversationPanelOpen && (
                        <>
                            {/* Backdrop for Mobile Overlay */}
                            {isMobileView && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setConversationPanelOpen(false)}
                                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                                />
                            )}
                            <motion.div
                                initial={isMobileView ? { x: '-100%' } : { width: 0, opacity: 0 }}
                                animate={isMobileView ? { x: 0 } : { 
                                    width: isConversationPanelMinimized ? 80 : 300,
                                    opacity: 1
                                }}
                                exit={isMobileView ? { x: '-100%' } : { width: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className={`flex-shrink-0 h-full z-50 overflow-hidden bg-gray-900 border-r border-white/5 ${
                                    isMobileView 
                                    ? 'fixed left-0 top-0 w-80 shadow-2xl safe-top safe-bottom' 
                                    : 'relative'
                                }`}
                            >
                                <Sidebar />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Dynamic View Area */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {renderMainContent()}
                    </div>
                    
                    {/* Navigation System */}
                    {isMobileView ? <MobileBottomNav /> : <AppStatusBar />}
                </div>
            </div>

            <AnimatePresence>
                {contextMenu.isOpen && (
                    <ContextMenu position={contextMenu.position} items={menuItems} onClose={closeContextMenu} />
                )}
            </AnimatePresence>

            <GlobalModals />
            <AnimatePresence>
                {isBriefingOpen && <MorningBriefing onClose={() => setIsBriefingOpen(false)} />}
            </AnimatePresence>
            <Notifications />
        </main>
    );
};