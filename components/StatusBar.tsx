
"use client";

import React, { useMemo } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { CogIcon, UserCircleIcon, BookmarkIcon, CpuChipIcon, ClockIcon, DocumentTextIcon, BeakerIcon } from '@/components/Icons';
import { ChatBubbleLeftRightIcon } from '@/components/Icons';
import type { CognitiveStatus } from '@/lib/types';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: StatusBarProps) => {
    const { status, currentConversation, messages } = useConversation();
    
    const model = useMemo(() => {
        if (!currentConversation) return 'gemini-2.5-flash';
        return currentConversation.model || 'gemini-2.5-flash';
    }, [currentConversation]);

    const conversationStats = useMemo(() => {
        if (!currentConversation || messages.length === 0) return null;
        const modelMessages = messages.filter(m => m.role === 'model' && m.responseTime);
        const totalResponseTime = modelMessages.reduce((acc, msg) => acc + (msg.responseTime || 0), 0);
        return { 
            messageCount: messages.length, 
            avgResponseTime: modelMessages.length > 0 ? Math.round(totalResponseTime / modelMessages.length) : 0 
        };
    }, [currentConversation, messages]);

    const currentActionText = useMemo(() => {
        const action = status.currentAction;
        if (!action) return 'System Ready';
        if (typeof action === 'string') return action;
        return (action as CognitiveStatus).details || 'Processing...';
    }, [status.currentAction]);

    return (
        <div className="bg-gray-800/60 backdrop-blur-xl text-gray-400 text-[10px] p-2 border-t border-white/10 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="font-bold uppercase tracking-widest">Live Trace</span>
                </div>
                <span className="italic truncate">{currentActionText}</span>
            </div>

            {currentConversation && conversationStats && (
                <div className="hidden md:flex items-center gap-4 text-gray-500">
                    <span className="flex items-center gap-1"><ChatBubbleLeftRightIcon className="w-3.5 h-3.5" /> {conversationStats.messageCount}</span>
                    <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {conversationStats.avgResponseTime}ms</span>
                </div>
            )}

            <div className="flex items-center gap-3">
                 <button onClick={onAgentConfigClick} className="flex items-center gap-1 hover:text-white transition-colors">
                    <UserCircleIcon className="w-3.5 h-3.5" />
                    <span>Agent</span>
                </button>
                <button onClick={onSettingsClick} className="flex items-center gap-1 hover:text-white transition-colors">
                     <CogIcon className="w-3.5 h-3.5" />
                    <span>{model}</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
