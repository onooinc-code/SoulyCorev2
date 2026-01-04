
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
        className="relative my-8 w-full px-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full h-px bg-white/5"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-gray-900 p-1.5 rounded-full border border-white/5">
                <CpuChipIcon className="w-4 h-4 text-indigo-500/40" />
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
    
    return (
        <div 
            ref={scrollContainerRef} 
            className="absolute inset-0 flex flex-col px-3 sm:px-6 py-4 custom-scrollbar overflow-y-auto overflow-x-hidden w-full"
        >
            <div className="w-full flex flex-col flex-1 mx-auto max-w-full">
                {threadedMessages.length > 0 ? (
                    <div className="space-y-6 pb-48 w-full max-w-full overflow-hidden">
                        {threadedMessages.map((msg, index) => (
                            <React.Fragment key={msg.id}>
                                <div data-message-id={msg.id} className="w-full max-w-full overflow-hidden">
                                    <Message 
                                        message={msg}
                                        onSummarize={onSummarize}
                                        onToggleBookmark={onToggleBookmark}
                                        onDelete={() => onDeleteMessage(msg.id)}
                                        onUpdateMessage={onUpdateMessage}
                                        onRegenerate={() => onRegenerate(msg.id)}
                                        onInspect={() => onInspect(msg.id)}
                                        isContextAssemblyRunning={isLoading && index === threadedMessages.length - 1 && msg.role === 'user'}
                                        isMemoryExtractionRunning={backgroundTaskCount > 0 && index === threadedMessages.length - 1 && msg.role === 'model'}
                                        onViewHtml={onViewHtml}
                                        currentConversation={currentConversation}
                                        onSetConversationAlign={onSetConversationAlign}
                                        onReply={onReply}
                                        findMessageById={(id) => messages.find(m => m.id === id)}
                                        onViewContext={(type) => onViewContext(msg.id, type)}
                                    />
                                </div>
                                {msg.role === 'model' && index < threadedMessages.length - 1 && <ConversationTurnSeparator key={`sep-${msg.id}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 py-20">
                         <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <CpuChipIcon className="w-8 h-8 text-indigo-500/40" />
                         </div>
                        <h1 className="text-2xl font-bold text-white mb-2">SoulyCore</h1>
                        <p className="text-sm max-w-xs">الذكاء الاصطناعي بذاكرة مستدامة. كيف يمكنني مساعدتك اليوم؟</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageList;
