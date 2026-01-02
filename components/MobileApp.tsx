
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWindow from './ChatWindow';
import ActiveViewRenderer from './views/ActiveViewRenderer';
import MobileBottomNav from './MobileBottomNav';
import EmptyState from './ui/EmptyState';
import { ChatBubbleLeftRightIcon, XIcon } from './Icons';

const MotionDiv = motion.div as any;

const MobileApp = () => {
    const { 
        activeView, 
        isConversationPanelOpen, 
        setConversationPanelOpen,
        isZenMode 
    } = useUIState();
    
    const { currentConversation, createNewConversation } = useConversation();

    const renderContent = () => {
        if (activeView === 'chat') {
            if (currentConversation) return <ChatWindow />;
            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gray-900">
                    <EmptyState
                        icon={ChatBubbleLeftRightIcon}
                        title="ابدأ محادثة"
                        description="ابدأ الدردشة الآن مع العقل المعرفي."
                        action={{ label: 'محادثة جديدة', onClick: createNewConversation }}
                    />
                </div>
            );
        }
        return <ActiveViewRenderer />;
    };

    return (
        <div className="flex flex-col h-full w-full mobile-layout bg-gray-950">
            {/* Header always on top for mobile */}
            {!isZenMode && <Header />}

            {/* Sidebar as Full-Screen Drawer */}
            <AnimatePresence>
                {isConversationPanelOpen && (
                    <>
                        <MotionDiv 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConversationPanelOpen(false)}
                            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
                        />
                        <MotionDiv
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-[85%] bg-gray-900 z-[70] shadow-2xl border-r border-white/10"
                        >
                            <div className="h-full flex flex-col">
                                <div className="p-4 flex justify-between items-center border-b border-white/5">
                                    <span className="font-bold text-indigo-400">القائمة</span>
                                    <button onClick={() => setConversationPanelOpen(false)} className="p-2 bg-white/5 rounded-lg">
                                        <XIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <Sidebar />
                                </div>
                            </div>
                        </MotionDiv>
                    </>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <div className={`flex-1 flex flex-col min-h-0 relative ${!isZenMode ? 'pt-16' : ''}`}>
                {renderContent()}
            </div>

            {/* Bottom Nav */}
            {!isZenMode && activeView !== 'chat' && <MobileBottomNav />}
        </div>
    );
};

export default MobileApp;
