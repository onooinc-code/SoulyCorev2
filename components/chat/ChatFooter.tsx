
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import ChatInput from '../ChatInput';
import type { Contact } from '@/lib/types';

interface ChatFooterProps {
    proactiveSuggestion: string | null;
    onSuggestionClick: () => void;
    onDismissSuggestion: () => void;
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
}

const ChatFooter = ({
    proactiveSuggestion,
    onSuggestionClick,
    onDismissSuggestion,
    onSendMessage,
    isLoading
}: ChatFooterProps) => {
    return (
        <div className="flex-shrink-0">
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
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </div>
    );
};

export default ChatFooter;
