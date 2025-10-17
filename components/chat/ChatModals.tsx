"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import type { Conversation } from '@/lib/types';

// Modals
import ConversationSettingsModal from '../ConversationSettingsModal';
import AgentConfigModal from '../AgentConfigModal';
import SummaryModal from '../SummaryModal';

// Dynamically imported modals
const CognitiveInspectorModal = dynamic(() => import('../CognitiveInspectorModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Inspector...</p></div>
});

const HtmlViewerModal = dynamic(() => import('../HtmlViewerModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Viewer...</p></div>
});

interface ChatModalsProps {
    isSettingsModalOpen: boolean;
    setSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAgentConfigModalOpen: boolean;
    setAgentConfigModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentConversation: Conversation | null;
    summaryModalState: { isOpen: boolean; text: string; isLoading: boolean; };
    setSummaryModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; text: string; isLoading: boolean; }>>;
    inspectorModalState: { isOpen: boolean; messageId: string | null; };
    setInspectorModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; messageId: string | null; }>>;
    htmlModalState: { isOpen: boolean; content: string; };
    setHtmlModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; content: string; }>>;
}

const ChatModals = ({
    isSettingsModalOpen,
    setSettingsModalOpen,
    isAgentConfigModalOpen,
    setAgentConfigModalOpen,
    currentConversation,
    summaryModalState,
    setSummaryModalState,
    inspectorModalState,
    setInspectorModalState,
    htmlModalState,
    setHtmlModalState
}: ChatModalsProps) => {
    return (
        <>
            <ConversationSettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setSettingsModalOpen(false)} 
            />
            <AgentConfigModal 
                isOpen={isAgentConfigModalOpen} 
                onClose={() => setAgentConfigModalOpen(false)} 
                conversation={currentConversation}
            />
            <SummaryModal 
                isOpen={summaryModalState.isOpen}
                onClose={() => setSummaryModalState({isOpen: false, text: '', isLoading: false})}
                summaryText={summaryModalState.text}
                isLoading={summaryModalState.isLoading}
            />
            <CognitiveInspectorModal 
                isOpen={inspectorModalState.isOpen}
                onClose={() => setInspectorModalState({ isOpen: false, messageId: null })}
                messageId={inspectorModalState.messageId}
            />
            <HtmlViewerModal 
                isOpen={htmlModalState.isOpen}
                onClose={() => setHtmlModalState({ isOpen: false, content: '' })}
                htmlContent={htmlModalState.content}
            />
        </>
    );
};

export default ChatModals;