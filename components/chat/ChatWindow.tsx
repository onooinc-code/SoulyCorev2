"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import type { Message as MessageType, Contact, ILinkPredictionProposal } from '@/lib/types';
import { AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';

import Header from '@/components/Header';
import MessageList from '@/components/chat/MessageList';
import ErrorDisplay from '@/components/chat/ErrorDisplay';
import ChatFooter from '@/components/chat/ChatFooter';
import ChatModals from '@/components/chat/ChatModals';
import StatusBar from '@/components/StatusBar';
import LogOutputPanel from '@/components/LogOutputPanel';

const ChatWindow = () => {
    const { 
        currentConversation, messages, addMessage, toggleBookmark, isLoading, status,
        setStatus, clearError, deleteMessage, updateMessage, regenerateAiResponse,
        regenerateUserPromptAndGetResponse, backgroundTaskCount, activeWorkflow,
        updateCurrentConversation,
    } = useConversation();
    
    const { isZenMode, isLogPanelOpen, setExtractionTarget, setActiveView, isMobileView } = useUIState();
    const { addNotification } = useNotification();
    
    const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<MessageType | null>(null);
    
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAgentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
    const [summaryModalState, setSummaryModalState] = useState({isOpen: false, text: '', isLoading: false});
    const [inspectorModalState, setInspectorModalState] = useState({ isOpen: false, messageId: null });
    const [contextViewerModalState, setContextViewerModalState] = useState({ isOpen: false, messageId: null, type: null });
    const [htmlModalState, setHtmlModalState] = useState({ isOpen: false, content: '' });

    useEffect(() => { setProactiveSuggestion(null); setReplyToMessage(null); }, [currentConversation]);

    const handleSendMessage = async (content: string, mentionedContacts: Contact[]) => {
        if (!content.trim()) return;
        const userMessage: Omit<MessageType, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'user', content, tokenCount: Math.ceil(content.length / 4), lastUpdatedAt: new Date(),
        };
        const { aiResponse, suggestion, memoryProposal, linkProposal } = await addMessage(userMessage, mentionedContacts, undefined, replyToMessage?.id);
        setReplyToMessage(null);
        if (aiResponse) setProactiveSuggestion(suggestion);
        if (memoryProposal) {
          addNotification({
            type: 'info', title: 'فرصة تعلم جديدة', message: "تعلمت شيئاً جديداً من محادثتنا. هل تود مراجعته؟",
            action: { label: 'مراجعة وحفظ', onClick: () => { setExtractionTarget({ type: 'conversation', id: memoryProposal.conversationId }); setActiveView('memory_extraction_hub'); }}
          });
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 overflow-hidden chat-container">
            {!isZenMode && <Header />}
            
            <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                <MessageList 
                    messages={messages}
                    currentConversation={currentConversation}
                    isLoading={isLoading}
                    activeWorkflow={activeWorkflow}
                    backgroundTaskCount={backgroundTaskCount}
                    onSummarize={(content) => {
                        setSummaryModalState({ isOpen: true, text: '', isLoading: true });
                        fetch('/api/summarize', { method: 'POST', body: JSON.stringify({ text: content }) })
                            .then(res => res.json())
                            .then(data => setSummaryModalState({ isOpen: true, text: data.summary, isLoading: false }));
                    }}
                    onToggleBookmark={toggleBookmark}
                    onDeleteMessage={deleteMessage}
                    onUpdateMessage={updateMessage}
                    onRegenerate={(id) => {
                        const m = messages.find(x => x.id === id);
                        if (!m) return;
                        m.role === 'model' ? regenerateAiResponse(id) : regenerateUserPromptAndGetResponse(id);
                    }}
                    onInspect={(id) => setInspectorModalState({ isOpen: true, messageId: id as any })}
                    onViewContext={(id, type) => setContextViewerModalState({ isOpen: true, messageId: id as any, type: type as any })}
                    onViewHtml={(content) => setHtmlModalState({ isOpen: true, content })}
                    onSetConversationAlign={(align) => currentConversation && updateCurrentConversation({ uiSettings: { ...currentConversation.uiSettings, textAlign: align } })}
                    onReply={setReplyToMessage}
                />
            </div>

            <ErrorDisplay status={status} isDbError={!!(status.error && /database|postgres/i.test(status.error))} clearError={clearError} />
            
            <ChatFooter 
                proactiveSuggestion={proactiveSuggestion}
                onSuggestionClick={() => { proactiveSuggestion && alert(`Action: ${proactiveSuggestion}`); setProactiveSuggestion(null); }}
                onDismissSuggestion={() => setProactiveSuggestion(null)}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                replyToMessage={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                onInspectClick={(id) => setInspectorModalState({ isOpen: true, messageId: id as any })}
            />
            
            <AnimatePresence>{isLogPanelOpen && <LogOutputPanel />}</AnimatePresence>

            <ChatModals 
                isSettingsModalOpen={isSettingsModalOpen} setSettingsModalOpen={setSettingsModalOpen}
                isAgentConfigModalOpen={isAgentConfigModalOpen} setAgentConfigModalOpen={setAgentConfigModalOpen}
                currentConversation={currentConversation}
                summaryModalState={summaryModalState as any} setSummaryModalState={setSummaryModalState as any}
                inspectorModalState={inspectorModalState as any} setInspectorModalState={setInspectorModalState as any}
                contextViewerModalState={contextViewerModalState as any} setContextViewerModalState={setContextViewerModalState as any}
                htmlModalState={htmlModalState} setHtmlModalState={setHtmlModalState}
            />
        </div>
    );
};

export default ChatWindow;