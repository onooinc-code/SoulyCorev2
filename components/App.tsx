
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Providers & Hooks
import { useConversation } from './providers/ConversationProvider';
import { useUIState } from './providers/UIStateProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useAppContextMenu } from '@/lib/hooks/useAppContextMenu';

// Layout Components
import NavigationRail from './NavigationRail';
import ConversationPanel from './ConversationPanel';
import MorningBriefing from './MorningBriefing';
import TopProgressBar from './TopProgressBar';
import AppStatusBar from './AppStatusBar';
import Notifications from './Notifications';

// Modals & Views
import GlobalModals from './modals/GlobalModals';
import ActiveViewRenderer from './views/ActiveViewRenderer';
import ContextMenu from './ContextMenu';
import ChatWindow from './ChatWindow';

export const App = () => {
    // State from providers
    const { currentConversation } = useConversation();
    const { 
        isConversationPanelOpen, 
        isConversationPanelMinimized,
        isMobileView,
        isZenMode,
        isContextMenuEnabled,
        setCommandPaletteOpen
    } = useUIState();

    // Local state for modals and context menu
    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number } }>({ isOpen: false, position: { x: 0, y: 0 } });
    const [bookmarksOpen, setBookmarksOpen] = useState(false);
    const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [addKnowledgeOpen, setAddKnowledgeOpen] = useState(false);
    const [responseViewerOpen, setResponseViewerOpen] = useState(false);

    // Context menu items derived from hook
    const menuItems = useAppContextMenu({
        setBookmarksOpen,
        setGlobalSettingsOpen,
        setShortcutsOpen,
        setAddKnowledgeOpen,
        setResponseViewerOpen,
        setCommandPaletteOpen
    });

    // Keyboard shortcuts
    useKeyboardShortcuts({
        'mod+k': () => setCommandPaletteOpen(prev => !prev),
        'escape': () => {
            setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
            setBookmarksOpen(false);
            setGlobalSettingsOpen(false);
            setShortcutsOpen(false);
            setAddKnowledgeOpen(false);
            setResponseViewerOpen(false);
            setCommandPaletteOpen(false);
        }
    });

    // Right-click handler
    const handleContextMenu = (e: React.MouseEvent) => {
        if (!isContextMenuEnabled) return;
        e.preventDefault();
        setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY } });
    };

    const mainContent = currentConversation ? <ChatWindow /> : <ActiveViewRenderer />;

    return (
        <div 
            className={`h-screen w-screen bg-gray-900 text-gray-100 flex overflow-hidden font-sans ${isMobileView ? 'mobile-view' : ''}`}
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <Notifications />
            
            <AnimatePresence>
                {!isZenMode && <NavigationRail setBookmarksOpen={setBookmarksOpen} setGlobalSettingsOpen={setGlobalSettingsOpen} />}
            </AnimatePresence>

            <AnimatePresence>
                {isConversationPanelOpen && !isZenMode && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ 
                            width: isConversationPanelMinimized ? '4.5rem' : '20rem',
                            opacity: 1
                        }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-shrink-0"
                    >
                        <ConversationPanel isMinimized={isConversationPanelMinimized} />
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col min-w-0 pb-6">
                {mainContent}
            </main>
            
            <GlobalModals
                bookmarksOpen={bookmarksOpen}
                setBookmarksOpen={setBookmarksOpen}
                globalSettingsOpen={globalSettingsOpen}
                setGlobalSettingsOpen={setGlobalSettingsOpen}
                shortcutsOpen={shortcutsOpen}
                setShortcutsOpen={setShortcutsOpen}
                addKnowledgeOpen={addKnowledgeOpen}
                setAddKnowledgeOpen={setAddKnowledgeOpen}
                responseViewerOpen={responseViewerOpen}
                setResponseViewerOpen={setResponseViewerOpen}
            />

            <ContextMenu
                items={menuItems}
                isOpen={contextMenu.isOpen}
                position={contextMenu.position}
                onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
            />
            
            <MorningBriefing />
            <AppStatusBar />
        </div>
    );
};
