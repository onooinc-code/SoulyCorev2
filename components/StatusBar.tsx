

"use client";

import React, { useMemo } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { CogIcon, UserCircleIcon, BookmarkIcon, CpuChipIcon, ClockIcon, DocumentTextIcon } from './Icons';
import { ChatBubbleLeftRightIcon } from './Icons';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: StatusBarProps) => {
    const { status, currentConversation, messages } = useConversation();
    const model = currentConversation?.model || 'gemini-2.5-flash';

    const conversationStats = useMemo(() => {
        if (!currentConversation || messages.length === 0) return null;
        
        const messageCount = messages.length;
        const totalTokens = messages.reduce((acc, msg) => acc + (msg.tokenCount || 0), 0);
        const bookmarkedCount = messages.filter(msg => msg.isBookmarked).length;
        const wordCount = messages.reduce((acc, msg) => acc + (msg.content.split(/\s+/).filter(Boolean).length || 0), 0);

        const modelMessages = messages.filter(m => m.role === 'model' && m.responseTime);
        const totalResponseTime = modelMessages.reduce((acc, msg) => acc + (msg.responseTime || 0), 0);
        const avgResponseTime = modelMessages.length > 0 ? Math.round(totalResponseTime / modelMessages.length) : 0;
        
        return { messageCount, totalTokens, bookmarkedCount, wordCount, avgResponseTime };
    }, [currentConversation, messages]);

    return (
        <div className="bg-gray-800/60 backdrop-blur-xl text-gray-400 text-xs p-2 border-t border-white/10 flex justify-between items-center gap-4">
            <div className="flex-1 italic truncate min-w-0">
                <span>{status.currentAction || 'Ready'}</span>
            </div>

            {currentConversation && conversationStats && (
                <div className="flex items-center gap-4 flex-shrink-0 text-gray-400">
                    <div className="flex items-center gap-1.5" title="Messages in this conversation">
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>{conversationStats.messageCount}</span>
                    </div>
                     <div className="flex items-center gap-1.5" title="Total words in this conversation">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>{conversationStats.wordCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total tokens used in this conversation">
                        <CpuChipIcon className="w-4 h-4" />
                        <span>{conversationStats.totalTokens}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Bookmarked messages in this conversation">
                        <BookmarkIcon className="w-4 h-4" />
                        <span>{conversationStats.bookmarkedCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Average AI response time">
                        <ClockIcon className="w-4 h-4" />
                        <span>{conversationStats.avgResponseTime} ms</span>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 flex-shrink-0">
                 <button 
                    onClick={onAgentConfigClick} 
                    disabled={!currentConversation} 
                    className="flex items-center gap-1 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed" 
                    title="Configure Agent: Set system instructions and memory preferences for this conversation."
                >
                    <UserCircleIcon className="w-4 h-4" />
                    <span>Agent</span>
                </button>
                <button 
                    onClick={onSettingsClick} 
                    disabled={!currentConversation} 
                    className="flex items-center gap-1 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed" 
                    title="Configure Model: Adjust model parameters like temperature for this conversation."
                >
                     <CogIcon className="w-4 h-4" />
                    <span className="truncate max-w-28">{model}</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBar;