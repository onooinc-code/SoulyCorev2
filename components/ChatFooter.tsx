
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from '@/components/ChatInput';
import type { Contact, Message, CognitiveStatus } from '@/lib/types';
import { XIcon, SparklesIcon, RocketLaunchIcon, LinkIcon, BeakerIcon } from './Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import CognitiveStatusBar from './chat/CognitiveStatusBar';

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
    const { status, messages, isAgentEnabled, setIsAgentEnabled, isLinkPredictionEnabled, setIsLinkPredictionEnabled } = useConversation();
    const { setActiveView } = useUIState();

    const handleInspect = () => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMessage) onInspectClick(lastUserMessage.id);
    };

    const isCognitiveStatus = (action: any): action is CognitiveStatus => 
        typeof action === 'object' && action !== null && 'phase' in action;

    return (
        <div className="bg-gray-950 border-t border-white/5 relative z-30">
            <AnimatePresence>
                {replyToMessage && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-indigo-500/10 p-2 text-xs overflow-hidden border-b border-indigo-500/20">
                        <div className="flex justify-between items-center w-full px-4">
                            <button onClick={onCancelReply} className="p-1 hover:bg-white/10 rounded-full"><XIcon className="w-4 h-4" /></button>
                            <div className="text-indigo-300 truncate text-right">
                                الرد على: <em className="ml-1 opacity-70">"{replyToMessage.content.substring(0, 40)}..."</em>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {proactiveSuggestion && (
                     <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 py-2 flex justify-center items-center gap-3">
                        <div className="flex-1 max-w-2xl bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-4 py-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button onClick={onSuggestionClick} className="text-xs font-bold text-indigo-400 hover:text-white uppercase">نعم</button>
                                <button onClick={onDismissSuggestion} className="text-gray-500 hover:text-white"><XIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-indigo-200 text-right">
                                <span>{proactiveSuggestion}</span>
                                <SparklesIcon className="w-4 h-4 text-indigo-400" />
                            </div>
                        </div>
                     </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {isLoading && isCognitiveStatus(status.currentAction) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                        <CognitiveStatusBar status={status.currentAction} onInspect={handleInspect} />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="w-full flex items-end px-4 gap-2">
                <div className="flex-1">
                    <ChatInput 
                        onSendMessage={onSendMessage} 
                        isLoading={isLoading} 
                        replyToMessage={replyToMessage}
                        isAgentEnabled={isAgentEnabled}
                        onToggleAgent={() => setIsAgentEnabled(!isAgentEnabled)}
                        isLinkPredictionEnabled={isLinkPredictionEnabled}
                        onToggleLinkPrediction={() => setIsLinkPredictionEnabled(!isLinkPredictionEnabled)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatFooter;
