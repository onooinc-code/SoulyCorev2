

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/Sidebar';
import { useUIState } from '@/components/providers/UIStateProvider';
import { AnimatePresence, motion } from 'framer-motion';
import NavigationRail from './NavigationRail';
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

export const App = () => {
    const { 
        isConversationPanelOpen, 
        isConversationPanelMinimized,
        activeView,
        setCommandPaletteOpen,
    } = useUIState();

    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();
    const { currentConversation, backgroundTaskCount } = useConversation();
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);

    // Setup keyboard shortcuts
    const shortcuts = useMemo(() => ({
        'mod+k': () => setCommandPaletteOpen(prev => !prev),
    }), [setCommandPaletteOpen]);
    useKeyboardShortcuts(shortcuts);


    useEffect(() => {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('lastVisit');

        if (lastVisit !== today) {
            // Delay briefing to avoid layout shifts on load
            const timer = setTimeout(() => {
                setIsBriefingOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const mainContent = activeView === 'chat' && currentConversation ? <ChatWindow /> : <ActiveViewRenderer />;
    const showProgress = backgroundTaskCount > 0;

    return (
        <main
            className="flex h-screen w-screen overflow-hidden bg-gray-900"
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <AnimatePresence>
                {showProgress && <UniversalProgressIndicator />}
            </AnimatePresence>
            <NavigationRail />
            
            <AnimatePresence>
                {isConversationPanelOpen && (
                    <motion.div
                        initial={{ width: 0, padding: 0, marginRight: 0 }}
                        animate={{ 
                            width: isConversationPanelMinimized ? 80 : 320,
                            padding: isConversationPanelMinimized ? 0 : '',
                            marginRight: isConversationPanelMinimized ? 0 : '' 
                        }}
                        exit={{ width: 0, padding: 0, marginRight: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0 h-full overflow-hidden bg-gray-800"
                    >
                        <Sidebar />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {mainContent}
            </div>

            <AnimatePresence>
                {contextMenu.isOpen && (
                    <ContextMenu 
                        position={contextMenu.position}
                        items={menuItems}
                        onClose={closeContextMenu}
                    />
                )}
            </AnimatePresence>

            <GlobalModals />
            <AnimatePresence>
                {isBriefingOpen && (
                    <MorningBriefing onClose={() => setIsBriefingOpen(false)} />
                )}
            </AnimatePresence>
            <Notifications />
            <AppStatusBar />
        </main>
    );
};