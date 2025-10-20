"use client";

import React from 'react';
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

export const App = () => {
    const { 
        isConversationPanelOpen, 
        isConversationPanelMinimized,
        activeView 
    } = useUIState();

    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();
    const { currentConversation } = useConversation();

    const mainContent = activeView === 'chat' && currentConversation ? <ChatWindow /> : <ActiveViewRenderer />;

    return (
        <main
            className="flex h-screen w-screen overflow-hidden bg-gray-900"
            onContextMenu={handleContextMenu}
        >
            <TopProgressBar />
            <UniversalProgressIndicator />
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

            <ContextMenu 
                isOpen={contextMenu.isOpen}
                position={contextMenu.position}
                items={menuItems}
                onClose={closeContextMenu}
            />

            <GlobalModals />
            <MorningBriefing />
            <Notifications />
            <AppStatusBar />
        </main>
    );
};
