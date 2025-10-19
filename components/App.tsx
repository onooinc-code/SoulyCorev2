// components/App.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from './providers/ConversationProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useAppContextMenu } from '@/lib/hooks/useAppContextMenu';

import ChatWindow from './ChatWindow';
import NavigationRail from './NavigationRail';
import ConversationPanel from './ConversationPanel';
import ContextMenu from './ContextMenu';
import GlobalModals from '@/components/modals/GlobalModals';
import MorningBriefing from './MorningBriefing';
import Notifications from './Notifications';
import AppStatusBar from './AppStatusBar';
import TopProgressBar from './TopProgressBar';
import ActiveViewRenderer from './views/ActiveViewRenderer';
import DataHubWidget from './data_hub/DataHubWidget';

export const App = () => {
    const {
        activeView,
        isConversationPanelOpen,
        isConversationPanelMinimized,
        isMobileView,
        isZenMode,
        isFullscreen,
        setCommandPaletteOpen,
        isDataHubWidgetOpen,
        setDataHubWidgetOpen,
    } = useUIState();

    const { currentConversation, createNewConversation } = useConversation();
    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    useKeyboardShortcuts({
        'mod+k': () => setCommandPaletteOpen(prev => !prev),
        'mod+n': () => createNewConversation(),
    });
    
    useEffect(() => {
        if (isFullscreen) window.focus();
    }, [isFullscreen]);

    const showChat = activeView === 'chat' && currentConversation;

    return (
        <div 
            className={`w-screen h-screen overflow-hidden flex transition-all duration-300 ${isMobileView ? 'max-w-sm mx-auto my-auto h-[80vh] rounded-2xl shadow-2xl border-4 border-gray-700' : ''}`}
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <Notifications />
            
            {!isZenMode && <NavigationRail />}

            <AnimatePresence>
                {!isZenMode && isConversationPanelOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: isConversationPanelMinimized ? 68 : 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0 h-full"
                        onAnimationComplete={() => window.dispatchEvent(new Event('resize'))}
                    >
                        <ConversationPanel isMinimized={isConversationPanelMinimized} />
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 min-w-0 h-full">
                {showChat ? <ChatWindow /> : <ActiveViewRenderer />}
            </main>
            
            <GlobalModals />

            <ContextMenu
                items={menuItems}
                position={contextMenu.position}
                isOpen={contextMenu.isOpen}
                onClose={closeContextMenu}
            />
            
            {isClient && <MorningBriefing />}

            {!isZenMode && <AppStatusBar />}

            <DataHubWidget isOpen={isDataHubWidgetOpen} onClose={() => setDataHubWidgetOpen(false)} />
        </div>
    );
};