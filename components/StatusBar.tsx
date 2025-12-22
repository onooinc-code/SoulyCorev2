
"use client";

import React, { useMemo } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { CogIcon, ClockIcon, WrenchScrewdriverIcon, LogIcon, RocketLaunchIcon, BrainIcon, CircleStackIcon, LinkIcon } from '@/components/Icons';
import { ChatBubbleLeftRightIcon } from '@/components/Icons';
import type { CognitiveStatus, ExecutionStatus } from '@/lib/types';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: StatusBarProps) => {
    const { status, currentConversation, messages, toolState, memoryMonitor } = useConversation();
    const { setLogPanelOpen, isLogPanelOpen, setToolInspectorOpen, setActiveView } = useUIState();
    
    const model = useMemo(() => currentConversation?.model || 'gemini-2.5-flash', [currentConversation]);

    const getStatusStyles = (status: ExecutionStatus) => {
        const base = "flex items-center gap-1 transition-all duration-300 px-2 py-0.5 rounded-full border ";
        switch (status) {
            case 'executing': return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse";
            case 'success': return base + "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse";
            case 'error': return base + "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse";
            default: return base + "text-gray-500 border-transparent hover:text-white";
        }
    };

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

            <div className="flex items-center gap-3">
                 <button onClick={() => setLogPanelOpen(!isLogPanelOpen)} className={`flex items-center gap-1 ${isLogPanelOpen ? 'text-indigo-400' : 'hover:text-white'}`} title="Debug Logs">
                    <LogIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Logs</span>
                </button>

                 <button onClick={() => setToolInspectorOpen(true)} className={getStatusStyles(toolState.status)} title="Tool Execution">
                    <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Tools</span>
                </button>

                <div className="h-3 w-px bg-white/10 mx-1 hidden md:block" />

                {/* Memory Tier Monitors */}
                <button className={getStatusStyles(memoryMonitor.semantic.status)} title="Semantic Memory (Pinecone)">
                    <BrainIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Semantic</span>
                </button>
                <button className={getStatusStyles(memoryMonitor.structured.status)} title="Structured Memory (Postgres)">
                    <CircleStackIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Structured</span>
                </button>
                <button className={getStatusStyles(memoryMonitor.graph.status)} title="Graph Memory (EdgeDB)">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Graph</span>
                </button>
                <button className={getStatusStyles(memoryMonitor.episodic.status)} title="Episodic Memory (History)">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Episodic</span>
                </button>

                <div className="h-3 w-px bg-white/10 mx-1 hidden md:block" />

                 <button onClick={() => setActiveView('agent_center')} className="flex items-center gap-1 hover:text-white transition-colors">
                    <RocketLaunchIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Agent</span>
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
