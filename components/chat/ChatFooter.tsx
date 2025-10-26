"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from '@/components/ChatInput';
import type { Contact, Message } from '@/lib/types';
import { XIcon } from '../Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import CognitiveStatusBar from './CognitiveStatusBar';

interface ChatFooterProps {
    proactiveSuggestion: string | null;
    onSuggestionClick: () => void;
    onDismissSuggestion: () => void;
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: Message | null;
    onCancelReply: () => void;
    onInspectClick: (messageId: string) => void;
}

const ChatFooter = ({
    proactiveSuggestion,
    onSuggestionClick,
    onDismissSuggestion,
    onSendMessage,
    isLoading,
    replyToMessage,
    onCancelReply,
    onInspectClick
}: ChatFooterProps) => {
    const { status, messages } = useConversation();

    const handleInspect = () => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMessage) {
            onInspectClick(lastUserMessage.id);
        }
    };

    return (
        <div className="flex-shrink-0">
            <AnimatePresence>
                {replyToMessage && (
                     <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-800 border-t border-gray-700 p-2 text-sm overflow-hidden"
                     >
                        <div className="flex justify-between items-center max-w-4xl mx-auto">
                            <div className="text-gray-400">
                                Replying to <strong className="text-gray-300">{replyToMessage.role === 'user' ? 'your message' : 'the model'}</strong>:
                                <em className="ml-2 truncate">"{replyToMessage.content.substring(0, 50)}..."</em>
                            </div>
                            <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {proactiveSuggestion && (
                 <motion.div 
                    initial={{ y: 50, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="p-3 bg-gray-800 border-t border-gray-700 flex justify-center items-center gap-4"
                >
                    <p className="text-sm text-indigo-300">{proactiveSuggestion}</p>
                    <button onClick={onSuggestionClick} className="px-3 py-1 text-sm bg-indigo-600 rounded-md hover:bg-indigo-500">Yes</button>
                    <button onClick={onDismissSuggestion} className="text-xs text-gray-400 hover:underline">Dismiss</button>
                 </motion.div>
            )}
            
            <AnimatePresence>
                {isLoading && typeof status.currentAction === 'object' && status.currentAction !== null && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <CognitiveStatusBar
                            status={status.currentAction}
                            onInspect={handleInspect}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} replyToMessage={replyToMessage} />
        </div>
    );
};

export default ChatFooter;