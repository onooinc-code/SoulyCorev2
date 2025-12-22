
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import type { Conversation } from '@/lib/types';
import { AnimatePresence } from 'framer-motion';

// Directly imported modals
import ConversationSettingsModal from '@/components/ConversationSettingsModal';
import SummaryModal from '@/components/modals/SummaryModal';

// Dynamically imported modals for performance
const CognitiveInspectorModal = dynamic(() => import('@/components/CognitiveInspectorModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Inspector...</p></div>
});
const ContextViewerModal = dynamic(() => import('@/components/ContextViewerModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Viewer...</p></div>
});
const HtmlViewerModal = dynamic(() => import('@/components/HtmlViewerModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Viewer...</p></div>
});


interface ChatModalsProps {
    isSettingsModalOpen: boolean;
    setSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentConversation: Conversation | null;
    summaryModalState: { isOpen: boolean; text: string; isLoading: boolean; };
    setSummaryModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; text: string; isLoading: boolean; }>>;
    inspectorModalState: { isOpen: boolean; messageId: string | null; };
    setInspectorModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; messageId: string | null; }>>;
    contextViewerModalState: { isOpen: boolean; messageId: string | null; type: 'prompt' | 'system' | 'config' | null; };
    setContextViewerModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; messageId: string | null; type: 'prompt' | 'system' | 'config' | null; }>>;
    htmlModalState: { isOpen: boolean; content: string; };
    setHtmlModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; content: string; }>>;
}

const ChatModals = ({
    isSettingsModalOpen,
    setSettingsModalOpen,
    currentConversation,
    summaryModalState,
    setSummaryModalState,
    inspectorModalState,
    setInspectorModalState,
    contextViewerModalState,
    setContextViewerModalState,
    htmlModalState,
    setHtmlModalState
}: ChatModalsProps) => {
    return (
        <>
            <AnimatePresence>
                {isSettingsModalOpen && currentConversation && (
                    <ConversationSettingsModal 
                        onClose={() => setSettingsModalOpen(false)} 
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {summaryModalState.isOpen && (
                    <SummaryModal 
                        title="Message Summary"
                        onClose={() => setSummaryModalState({isOpen: false, text: '', isLoading: false})}
                        summaryText={summaryModalState.text}
                        isLoading={summaryModalState.isLoading}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {inspectorModalState.isOpen && (
                    <CognitiveInspectorModal 
                        onClose={() => setInspectorModalState({ isOpen: false, messageId: null })}
                        messageId={inspectorModalState.messageId}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {contextViewerModalState.isOpen && (
                     <ContextViewerModal
                        onClose={() => setContextViewerModalState({ isOpen: false, messageId: null, type: null })}
                        messageId={contextViewerModalState.messageId}
                        contextType={contextViewerModalState.type}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {htmlModalState.isOpen && (
                    <HtmlViewerModal 
                        onClose={() => setHtmlModalState({ isOpen: false, content: '' })}
                        htmlContent={htmlModalState.content}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatModals;
