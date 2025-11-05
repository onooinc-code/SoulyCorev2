

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/Sidebar';
import { useUIState } from '@/components/providers/UIStateProvider';
import { AnimatePresence, motion } from 'framer-motion';
import TopHeader from './TopHeader'; // New top navigation header
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
        isConversationPanelMinimized,
        activeView,
        setCommandPaletteOpen,
    } = useUIState();

    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();
    const { currentConversation, backgroundTaskCount, createNewConversation } = useConversation();
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

    const renderMainContent = () => {
        if (activeView === 'chat') {
            if (currentConversation) {
                return <ChatWindow />;
            }
            // FIX: Instead of showing a cryptic error from ActiveViewRenderer, display a helpful EmptyState
            // when the chat view is active but no conversation is selected. This improves UX and handles a
            // potential race condition on initial load.
            return (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <EmptyState
                        icon={ChatBubbleLeftRightIcon}
                        title="No Conversation Selected"
                        description="Select a conversation from the sidebar or create a new one to begin chatting."
                        action={{
                            label: 'Start New Conversation',
                            onClick: createNewConversation,
                        }}
                    />
                </div>
            );
        }
        return <ActiveViewRenderer />;
    };

    const mainContent = renderMainContent();
    const showProgress = backgroundTaskCount > 0;

    return (
        <main
            className="flex flex-col h-screen w-screen overflow-hidden bg-gray-900"
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <AnimatePresence>
                {showProgress && <UniversalProgressIndicator />}
            </AnimatePresence>
            
            <TopHeader />

            <div className="flex-1 flex flex-row min-w-0 h-full relative">
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

                <div className="flex-1 flex flex-col min-w-0 h-full relative pb-6">
                    {mainContent}
                </div>
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
