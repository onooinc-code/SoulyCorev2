
"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Conversation, Message as MessageType, ActiveWorkflowState } from '@/lib/types';
import Message from '../Message';
import { useConversation } from '@/components/providers/ConversationProvider';
import { CpuChipIcon } from '../Icons';

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
    onReply: (message: MessageType) => void;
    onViewContext: (messageId: string, type: 'prompt' | 'system' | 'config') => void;
}

const ConversationTurnSeparator: React.FC = () => (
    <motion.div 
        className="relative my-6 w-full px-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-gray-900 p-1.5 rounded-full border border-gray-800 shadow-xl">
                <CpuChipIcon className="w-4 h-4 text-indigo-500/60" />
            </span>
        </div>
    </motion.div>
);


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
    onSetConversationAlign,
    onReply,
    onViewContext
}: MessageListProps) => {
    const { scrollToMessageId, setScrollToMessageId } = useConversation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollToMessageId) {
            const element = document.querySelector(`[data-message-id="${scrollToMessageId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('bg-indigo-900/30');
                setTimeout(() => {
                    element.classList.remove('bg-indigo-900/30');
                }, 2500);
            }
            setScrollToMessageId(null);
        } else {
            const timer = setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, scrollToMessageId, setScrollToMessageId]);

    const lastMessageIds = useMemo(() => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
        return {
            user: lastUserMessage?.id,
            model: lastModelMessage?.id,
        };
    }, [messages]);

    const threadedMessages = useMemo(() => {
        const messageMap = new Map(messages.map(m => [m.id, { ...m, threadMessages: [] as MessageType[] }]));
        const topLevelMessages: MessageType[] = [];

        for (const message of messages) {
            if (message.parentMessageId && messageMap.has(message.parentMessageId)) {
                messageMap.get(message.parentMessageId)?.threadMessages?.push(messageMap.get(message.id)!);
            } else {
                topLevelMessages.push(messageMap.get(message.id)!);
            }
        }
        return topLevelMessages;
    }, [messages]);
    
    const findMessageById = (id: string): MessageType | undefined => {
        return messages.find(m => m.id === id);
    }

    return (
        <div 
            ref={scrollContainerRef} 
            className="absolute inset-0 flex flex-col p-4 sm:p-8 custom-scrollbar overflow-y-auto overflow-x-hidden w-full max-w-full"
        >
            <div className="w-full max-w-full flex flex-col flex-1 mx-auto">
                {threadedMessages.length > 0 ? (
                    <div className="space-y-6 pb-40 w-full max-w-full">
                        {threadedMessages.map((msg, index) => {
                            let userMessageIdForInspection: string | null = null;
                            if (msg.role === 'user') {
                                userMessageIdForInspection = msg.id;
                            } else {
                                for (let i = index; i >= 0; i--) {
                                    if (threadedMessages[i].role === 'user') {
                                        userMessageIdForInspection = threadedMessages[i].id;
                                        break;
                                    }
                                }
                            }

                            return (
                                <React.Fragment key={msg.id}>
                                    <div data-message-id={msg.id} className="w-full max-w-full flex flex-col overflow-hidden">
                                        <Message 
                                            message={msg}
                                            onSummarize={onSummarize}
                                            onToggleBookmark={onToggleBookmark}
                                            onDelete={() => onDeleteMessage(msg.id)}
                                            onUpdateMessage={onUpdateMessage}
                                            onRegenerate={() => onRegenerate(msg.id)}
                                            onInspect={() => userMessageIdForInspection && onInspect(userMessageIdForInspection)}
                                            isContextAssemblyRunning={isLoading && msg.role === 'user' && msg.id === lastMessageIds.user && !activeWorkflow}
                                            isMemoryExtractionRunning={backgroundTaskCount > 0 && msg.role === 'model' && msg.id === lastMessageIds.model}
                                            onViewHtml={onViewHtml}
                                            currentConversation={currentConversation}
                                            onSetConversationAlign={onSetConversationAlign}
                                            onReply={onReply}
                                            findMessageById={findMessageById}
                                            onViewContext={(type) => userMessageIdForInspection && onViewContext(userMessageIdForInspection, type)}
                                        />
                                    </div>
                                    {msg.role === 'model' && index < threadedMessages.length - 1 && <ConversationTurnSeparator key={`sep-${msg.id}`} />}
                                </React.Fragment>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-400">
                         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                            <svg className="w-20 h-20 text-indigo-500/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m3-3h.01M9 21h.01M15 21h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
                            </svg>
                        </motion.div>
                        <h1 className="text-3xl font-black text-white mt-6 tracking-tight">SoulyCore</h1>
                        <p className="mt-3 max-w-xs text-sm text-gray-400">الذكاء الاصطناعي بذاكرة مستدامة. ابدأ المحادثة الآن.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageList;
