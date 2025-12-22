
"use client";

import React, { useMemo } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { CogIcon, UserCircleIcon, ClockIcon, WrenchScrewdriverIcon, LogIcon, RocketLaunchIcon } from '@/components/Icons';
import { ChatBubbleLeftRightIcon } from '@/components/Icons';
import type { CognitiveStatus, ToolExecutionStatus } from '@/lib/types';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: StatusBarProps) => {
    const { status, currentConversation, messages, toolState } = useConversation();
    const { setLogPanelOpen, isLogPanelOpen, setToolInspectorOpen, setActiveView } = useUIState();
    
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

    const toolButtonStyles = useMemo(() => {
        const base = "flex items-center gap-1 transition-all duration-300 px-2 py-0.5 rounded-full border ";
        switch (toolState.status) {
            case 'executing': return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse";
            case 'success': return base + "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse";
            case 'error': return base + "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse";
            default: return base + "text-gray-400 border-transparent hover:text-white";
        }
    }, [toolState.status]);

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
                 <button 
                    onClick={() => setLogPanelOpen(!isLogPanelOpen)} 
                    className={`flex items-center gap-1 transition-colors ${isLogPanelOpen ? 'text-indigo-400' : 'hover:text-white'}`}
                    title="Toggle Debug Log Panel"
                >
                    <LogIcon className="w-3.5 h-3.5" />
                    <span>Logs</span>
                </button>
                 <button 
                    onClick={() => setToolInspectorOpen(true)} 
                    className={toolButtonStyles}
                    title="Live Tool Monitor"
                >
                    <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                    <span>Tools</span>
                </button>
                 <button onClick={() => setActiveView('agent_center')} className="flex items-center gap-1 hover:text-white transition-colors">
                    <RocketLaunchIcon className="w-3.5 h-3.5" />
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
