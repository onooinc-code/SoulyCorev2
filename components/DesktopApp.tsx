
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import NavigationRail from './NavigationRail';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWindow from './ChatWindow';
import ActiveViewRenderer from './views/ActiveViewRenderer';
import AppStatusBar from './AppStatusBar';
import ContextMenu from './ContextMenu';
import { useAppContextMenu } from '@/lib/hooks/useAppContextMenu';
import EmptyState from './ui/EmptyState';
import { ChatBubbleLeftRightIcon } from './Icons';

const MotionDiv = motion.div as any;

const DesktopApp = () => {
    const { 
        activeView, 
        isConversationPanelOpen, 
        isConversationPanelMinimized,
        isZenMode 
    } = useUIState();
    
    const { currentConversation, createNewConversation } = useConversation();
    const { menuItems, contextMenu, handleContextMenu, closeContextMenu } = useAppContextMenu();

    const renderContent = () => {
        if (activeView === 'chat') {
            if (currentConversation) return <ChatWindow />;
            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gray-900">
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
        <div className="flex h-full w-full desktop-layout" onContextMenu={handleContextMenu}>
            <NavigationRail />
            
            <AnimatePresence mode="wait">
                {isConversationPanelOpen && (
                    <MotionDiv
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: isConversationPanelMinimized ? 80 : 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-full bg-gray-900 border-r border-white/5 overflow-hidden"
                    >
                        <Sidebar />
                    </MotionDiv>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 bg-gray-900 relative">
                {!isZenMode && <Header />}
                <div className={`flex-1 flex flex-col min-h-0 relative overflow-hidden ${!isZenMode ? 'pt-16' : ''}`}>
                    {renderContent()}
                </div>
                <AppStatusBar />
            </div>

            <AnimatePresence>
                {contextMenu.isOpen && (
                    <ContextMenu position={contextMenu.position} items={menuItems} onClose={closeContextMenu} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopApp;
