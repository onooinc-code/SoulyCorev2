
"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useLog } from '@/components/providers/LogProvider';
import type { Message as MessageType, Contact } from '@/lib/types';

// Refactored Components
import Header from './Header';
import MessageList from './chat/MessageList';
import ErrorDisplay from './chat/ErrorDisplay';
import ChatFooter from './chat/ChatFooter';
import ChatModals from './chat/ChatModals';
import StatusBar from './StatusBar';
import LogOutputPanel from './LogOutputPanel';

const ChatWindow = () => {
    // --- HOOKS ---
    const { 
        currentConversation, 
        messages, 
        addMessage,
        toggleBookmark,
        isLoading,
        status,
        setStatus,
        clearError,
        deleteMessage,
        updateMessage,
        regenerateAiResponse,
        regenerateUserPromptAndGetResponse,
        backgroundTaskCount,
        activeWorkflow,
        updateCurrentConversation,
    } = useConversation();
    const { isZenMode, isLogPanelOpen } = useUIState();
    const { log } = useLog();
    
    // --- STATE ---
    const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<MessageType | null>(null);
    
    // Modal States
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAgentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
    const [summaryModalState, setSummaryModalState] = useState<{isOpen: boolean, text: string, isLoading: boolean}>({isOpen: false, text: '', isLoading: false});
    const [inspectorModalState, setInspectorModalState] = useState<{ isOpen: boolean; messageId: string | null }>({ isOpen: false, messageId: null });
    const [htmlModalState, setHtmlModalState] = useState({ isOpen: false, content: '' });

    // --- EFFECTS ---
    useEffect(() => {
        // Clear suggestion when conversation changes
        setProactiveSuggestion(null);
        setReplyToMessage(null);
    }, [currentConversation]);

    // --- HANDLERS ---
    const handleSummarizeMessage = async (content: string) => {
        log('User requested message summary.');
        setSummaryModalState({ isOpen: true, text: '', isLoading: true });
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content }),
            });
            if (!res.ok) throw new Error('Failed to fetch summary from the server.');
            const data = await res.json();
            setSummaryModalState({ isOpen: true, text: data.summary, isLoading: false });
        } catch (error) {
            const errorText = 'Sorry, the summary could not be generated at this time.';
            log('Error fetching message summary.', { error: (error as Error).message }, 'error');
            setSummaryModalState({ isOpen: true, text: errorText, isLoading: false });
            setStatus({ error: (error as Error).message });
        }
    };

    const handleSendMessage = async (content: string, mentionedContacts: Contact[]) => {
        if (!content.trim()) return;
        
        const userMessage: Omit<MessageType, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'user',
            content,
            tokenCount: Math.ceil(content.length / 4),
        };

        const { aiResponse, suggestion } = await addMessage(userMessage, mentionedContacts, undefined, replyToMessage?.id);

        setReplyToMessage(null); // Clear reply state after sending

        if (aiResponse) {
            setProactiveSuggestion(suggestion);
        }
    };
    
    const handleSetConversationAlign = (align: 'left' | 'right') => {
        if (!currentConversation) return;
        const newUiSettings = { ...(currentConversation.ui_settings || {}), textAlign: align };
        updateCurrentConversation({ ui_settings: newUiSettings });
    };

    const handleRegenerate = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
    
        if (message.role === 'model') {
            regenerateAiResponse(messageId);
        } else if (message.role === 'user') {
            regenerateUserPromptAndGetResponse(messageId);
        }
    };
    
    const handleSuggestionClick = () => {
        if (!proactiveSuggestion) return;
        log('User clicked proactive suggestion.', { suggestion: proactiveSuggestion });
        alert(`Action triggered: ${proactiveSuggestion}`);
        setProactiveSuggestion(null);
    };

    const handleViewHtml = (htmlContent: string) => {
        setHtmlModalState({ isOpen: true, content: htmlContent });
    };

    const handleReply = (message: MessageType) => {
        log('User is replying to a message', { messageId: message.id });
        setReplyToMessage(message);
    }

    const isDbError = !!(status.error && /database|vercel|table|relation.+does not exist/i.test(status.error));

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-gray-900">
            {!isZenMode && <Header />}
            
            <MessageList 
                messages={messages}
                currentConversation={currentConversation}
                isLoading={isLoading}
                activeWorkflow={activeWorkflow}
                backgroundTaskCount={backgroundTaskCount}
                onSummarize={handleSummarizeMessage}
                onToggleBookmark={toggleBookmark}
                onDeleteMessage={deleteMessage}
                onUpdateMessage={updateMessage}
                onRegenerate={handleRegenerate}
                onInspect={(messageId) => setInspectorModalState({ isOpen: true, messageId })}
                onViewHtml={handleViewHtml}
                onSetConversationAlign={handleSetConversationAlign}
                onReply={handleReply}
            />

            {!isZenMode && currentConversation && (
                <StatusBar 
                    onSettingsClick={() => setSettingsModalOpen(true)}
                    onAgentConfigClick={() => setAgentConfigModalOpen(true)}
                />
            )}
            
            <ErrorDisplay 
                status={status}
                isDbError={isDbError}
                clearError={clearError}
            />
            
            <ChatFooter 
                proactiveSuggestion={proactiveSuggestion}
                onSuggestionClick={handleSuggestionClick}
                onDismissSuggestion={() => {
                    log('User dismissed proactive suggestion.', { suggestion: proactiveSuggestion });
                    setProactiveSuggestion(null);
                }}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                replyToMessage={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
            />

            <LogOutputPanel isOpen={isLogPanelOpen} />

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
