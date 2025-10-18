"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConversation } from './providers/ConversationProvider';
import { useSettings } from './providers/SettingsProvider';
import Header from './Header';
import MessageList from './chat/MessageList';
import ChatFooter from './chat/ChatFooter';
import StatusBar from './StatusBar';
import ErrorDisplay from './chat/ErrorDisplay';
import ChatModals from './chat/ChatModals';
import type { Contact, Message } from '@/lib/types';
import { useLog } from './providers/LogProvider';

const ChatWindow = () => {
    const { 
        currentConversation, 
        messages, 
        addMessage, 
        isLoading, 
        status, 
        clearError,
        regenerateAiResponse,
        regenerateUserPromptAndGetResponse,
        fetchMessages,
    } = useConversation();
    const { settings } = useSettings();
    const { log } = useLog();

    const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

    // Modal States
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAgentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
    const [summaryModalState, setSummaryModalState] = useState({ isOpen: false, text: '', isLoading: false });
    const [inspectorModalState, setInspectorModalState] = useState<{ isOpen: boolean; messageId: string | null }>({ isOpen: false, messageId: null });
    const [htmlModalState, setHtmlModalState] = useState({ isOpen: false, content: '' });

    const handleSendMessage = useCallback(async (content: string, mentionedContacts: Contact[]) => {
        setProactiveSuggestion(null); // Clear previous suggestion
        
        const { aiResponse, suggestion } = await addMessage({ role: 'user', content }, mentionedContacts, undefined, replyToMessage?.id);

        if (currentConversation && aiResponse) {
            const aiMessage = { role: 'model', content: aiResponse };
            // The addMessage hook doesn't add the AI response to the local state,
            // so we manually save it and then refetch all messages to update the UI.
            // This is inefficient but necessary without modifying the context provider.
            await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: aiMessage }),
            });
            fetchMessages(currentConversation.id);
        }

        if (suggestion) {
            setProactiveSuggestion(suggestion);
        }
        
        setReplyToMessage(null); // Clear reply context after sending

    }, [addMessage, currentConversation, replyToMessage?.id, fetchMessages]);

    const isDbError = status.error?.includes('database table not found');

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <Header />
            <MessageList 
                onReply={(message) => setReplyToMessage(message)}
                onSummarizeRequest={(content) => {
                    setSummaryModalState({ isOpen: true, text: '', isLoading: true });
                    fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: content }) })
                        .then(res => res.json())
                        .then(data => setSummaryModalState({ isOpen: true, text: data.summary, isLoading: false }))
                        .catch(() => setSummaryModalState({ isOpen: true, text: 'Failed to generate summary.', isLoading: false }));
                }}
                onInspectRequest={(messageId) => setInspectorModalState({ isOpen: true, messageId })}
                onViewHtmlRequest={(htmlContent) => setHtmlModalState({ isOpen: true, content: htmlContent })}
            />
            <ErrorDisplay status={status} isDbError={!!isDbError} clearError={clearError} />
            <ChatFooter 
                proactiveSuggestion={proactiveSuggestion}
                onSuggestionClick={() => {
                    if (proactiveSuggestion) {
                        handleSendMessage(proactiveSuggestion, []);
                    }
                }}
                onDismissSuggestion={() => setProactiveSuggestion(null)}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                replyToMessage={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                onInspectClick={(messageId) => setInspectorModalState({ isOpen: true, messageId })}
            />
            <StatusBar 
                onSettingsClick={() => setSettingsModalOpen(true)}
                onAgentConfigClick={() => setAgentConfigModalOpen(true)}
            />
            <ChatModals
                isSettingsModalOpen={isSettingsModalOpen}
                setSettingsModalOpen={setSettingsModalOpen}
                isAgentConfigModalOpen={isAgentConfigModalOpen}
                setAgentConfigModalOpen={setAgentConfigModalOpen}
                currentConversation={currentConversation}
                summaryModalState={summaryModalState}
                setSummaryModalState={setSummaryModalState}
                inspectorModalState={inspectorModalState}
                setInspectorModalState={setInspectorModalState}
                htmlModalState={htmlModalState}
                setHtmlModalState={setHtmlModalState}
            />
        </div>
    );
};

export default ChatWindow;
