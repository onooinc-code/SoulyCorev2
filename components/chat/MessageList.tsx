

"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
// FIX: Replaced direct import of type `Message` with `MessageType` alias to avoid naming conflicts, a common source of module-related errors.
import type { Conversation, Message as MessageType, ActiveWorkflowState } from '@/lib/types';
import Message from '../Message';
import LoadingIndicator from '../LoadingIndicator';

interface MessageListProps {
    messages: MessageType[];
    currentConversation: Conversation | null;
    isLoading: boolean;
    activeWorkflow: ActiveWorkflowState | null;
    backgroundTaskCount: number;
    onSummarize: (content: string) => void;
    onToggleBookmark: (messageId: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onUpdateMessage: (messageId: string, newContent: string) => void;
    onRegenerate: (messageId: string) => void;
    onInspect: (messageId: string) => void;
    onViewHtml: (htmlContent: string) => void;
    onSetConversationAlign: (align: 'left' | 'right') => void;
}

const MessageList = ({
    messages,
    currentConversation,
    isLoading,
    activeWorkflow,
    backgroundTaskCount,
    onSummarize,
    onToggleBookmark,
    onDeleteMessage,
    onUpdateMessage,
    onRegenerate,
    onInspect,
    onViewHtml,
    onSetConversationAlign
}: MessageListProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [messages]);

    const lastMessageIds = useMemo(() => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
        return {
            user: lastUserMessage?.id,
            model: lastModelMessage?.id,
        };
    }, [messages]);

    return (
        <div ref={scrollContainerRef} className="flex flex-col flex-1 p-6 overflow-y-auto">
            {messages.length > 0 ? (
                <div className="w-full mt-auto">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                <Message 
                                    message={msg}
                                    onSummarize={onSummarize}
                                    onToggleBookmark={onToggleBookmark}
                                    onDelete={() => onDeleteMessage(msg.id)}
                                    onUpdate={onUpdateMessage}
                                    onRegenerate={() => onRegenerate(msg.id)}
                                    onInspect={onInspect}
                                    isContextAssemblyRunning={isLoading && msg.role === 'user' && msg.id === lastMessageIds.user && !activeWorkflow}
                                    isMemoryExtractionRunning={backgroundTaskCount > 0 && msg.role === 'model' && msg.id === lastMessageIds.model}
                                    onViewHtml={onViewHtml}
                                    currentConversation={currentConversation}
                                    onSetConversationAlign={onSetConversationAlign}
                                />
                            </div>
                        ))}
                        {isLoading && activeWorkflow && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center py-4 gap-4 text-sm text-gray-400"
                            >
                                <LoadingIndicator />
                                <span>Executing workflow step {activeWorkflow.currentStepIndex + 1} of {activeWorkflow.prompt.chain_definition?.length}...</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 m-auto">
                     <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                        <svg className="w-16 h-16 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-200 mt-4">SoulyCore</h1>
                    <p className="mt-2 max-w-md">Your AI assistant with a persistent, intelligent memory. Start a new conversation to begin.</p>
                </div>
            )}
        </div>
    );
};

export default MessageList;
