"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// FIX: Corrected relative import path for useUIState to use the `@` alias.
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from './providers/ConversationProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
// FIX: Corrected import path. This error is due to placeholder file content, which will also be fixed.
import { useAppContextMenu } from '@/lib/hooks/useAppContextMenu';

import ChatWindow from './ChatWindow';
import NavigationRail from './NavigationRail';
import ConversationPanel from './ConversationPanel';
import ContextMenu from './ContextMenu';
// FIX: Corrected relative import path for GlobalModals to use the `@` alias.
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
        setConversationPanelOpen,
        isConversationPanelMinimized,
        isMobileView,
        isZenMode,
        isFullscreen,
        isCommandPaletteOpen, 
        setCommandPaletteOpen,
        isDataHubWidgetOpen,
        setDataHubWidgetOpen,
    } = useUIState();

    const { currentConversation, createNewConversation } = useConversation();
    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();

    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const shortcuts = {
        'mod+k': () => setCommandPaletteOpen(prev => !prev),
        'mod+n': () => createNewConversation(),
    };
    useKeyboardShortcuts(shortcuts);
    
    // Automatically focus the window when entering fullscreen to enable shortcuts
    useEffect(() => {
        if (isFullscreen) {
            window.focus();
        }
    }, [isFullscreen]);

    const showChat = activeView === 'chat' && currentConversation;

    return (
        <div 
            className={`w-screen h-screen overflow-hidden flex transition-all duration-300 ${isMobileView ? 'max-w-sm mx-auto my-auto h-[80vh] rounded-2xl shadow-2xl border-4 border-gray-700' : ''}`}
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <Notifications />
            
            {!isZenMode && <NavigationRail setBookmarksOpen={() => {}} setGlobalSettingsOpen={() => {}} />}

            <AnimatePresence>
                {!isZenMode && isConversationPanelOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: isConversationPanelMinimized ? 68 : 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0 h-full"
                        onAnimationComplete={() => {
                            // This is a workaround to force resize on components that need it, e.g., charts
                            window.dispatchEvent(new Event('resize'));
                        }}
                    >
                        <ConversationPanel isMinimized={isConversationPanelMinimized} />
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 min-w-0 h-full">
                {showChat ? <ChatWindow /> : <ActiveViewRenderer />}
            </main>
            
            <GlobalModals isCommandPaletteOpen={isCommandPaletteOpen} setCommandPaletteOpen={setCommandPaletteOpen} />

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