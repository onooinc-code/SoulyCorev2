"use client";

import React from 'react';
import dynamic from 'next/dynamic';
// FIX: Corrected import path for type.
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

// FIX: Added dynamic import for ContextViewerModal which was missing.
const ContextViewerModal = dynamic(() => import('../ContextViewerModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Viewer...</p></div>
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
    // FIX: Added missing props for the context viewer modal.
    contextViewerModalState: { isOpen: boolean; messageId: string | null; type: 'prompt' | 'system' | 'config' | null; };
    setContextViewerModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; messageId: string | null; type: 'prompt' | 'system' | 'config' | null; }>>;
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
    // FIX: Destructured the missing props for use in the component.
    contextViewerModalState,
    setContextViewerModalState,
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
            {/* FIX: Rendered the missing ContextViewerModal. */}
            <ContextViewerModal
                isOpen={contextViewerModalState.isOpen}
                onClose={() => setContextViewerModalState({ isOpen: false, messageId: null, type: null })}
                messageId={contextViewerModalState.messageId}
                contextType={contextViewerModalState.type}
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