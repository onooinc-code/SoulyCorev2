"use client";

import React, { useRef, useEffect } from 'react';
import { useConversation } from '../providers/ConversationProvider';
import Message from '../Message';
import type { Message as MessageType } from '@/lib/types';

interface MessageListProps {
    onReply: (message: MessageType) => void;
    onSummarizeRequest: (content: string) => void;
    onInspectRequest: (messageId: string) => void;
    onViewHtmlRequest: (htmlContent: string) => void;
}

const MessageList = ({ onReply, onSummarizeRequest, onInspectRequest, onViewHtmlRequest }: MessageListProps) => {
    const { messages, isLoading, scrollToMessageId, setScrollToMessageId } = useConversation();
    const scrollableDivRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollableDivRef.current) {
            if (scrollToMessageId) {
                const element = document.getElementById(`message-${scrollToMessageId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add a temporary highlight
                    element.classList.add('bg-indigo-500/20', 'transition-all', 'duration-1000');
                    setTimeout(() => {
                        element.classList.remove('bg-indigo-500/20');
                        setScrollToMessageId(null);
                    }, 2000);
                } else {
                    setScrollToMessageId(null);
                }
            } else if (messagesEndRef.current) {
                // Scroll to bottom for new messages
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [messages, isLoading, scrollToMessageId, setScrollToMessageId]);

    return (
        <div ref={scrollableDivRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {messages.map((msg) => (
                    <div id={`message-${msg.id}`} key={msg.id}>
                        <Message 
                            message={msg} 
                            onReply={onReply}
                            onSummarizeRequest={onSummarizeRequest}
                            onInspectRequest={onInspectRequest}
                            onViewHtmlRequest={onViewHtmlRequest}
                        />
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default MessageList;
