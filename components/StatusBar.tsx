
"use client";

import React, { useMemo, useState } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { 
    CogIcon, ClockIcon, WrenchScrewdriverIcon, LogIcon, 
    SparklesIcon, BrainIcon, CircleStackIcon, LinkIcon, 
    UserCircleIcon 
} from '@/components/Icons';
import type { ExecutionStatus, CognitiveStatus } from '@/lib/types';
import { motion } from 'framer-motion';

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: { onSettingsClick: () => void; onAgentConfigClick: () => void; }) => {
    const { status, currentConversation, toolState, memoryMonitor, runCognitiveSynthesis } = useConversation();
    const { setLogPanelOpen, isLogPanelOpen, setToolInspectorOpen, setMemoryInspector, setIsRoutingModalOpen, isMobileView } = useUIState();
    
    const model = useMemo(() => currentConversation?.model || 'gemini-3-flash-preview', [currentConversation]);

    const getStatusStyles = (status: ExecutionStatus) => {
        const base = "flex items-center gap-1 transition-all duration-300 px-2 py-1 rounded-full border ";
        switch (status) {
            case 'executing': return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse";
            case 'success': return base + "bg-green-500/20 text-green-400 border-green-500/50";
            case 'null': return base + "bg-orange-500/10 text-orange-400/70 border-orange-500/20";
            case 'error': return base + "bg-red-500/20 text-red-400 border-red-500/50";
            default: return base + "text-gray-500 border-transparent hover:text-white hover:bg-white/5";
        }
    };

    const currentActionText = useMemo(() => {
        const action = status.currentAction;
        if (!action) return 'Ready';
        if (typeof action === 'string') return action;
        return (action as CognitiveStatus).details || 'Processing...';
    }, [status.currentAction]);

    return (
        <div className="bg-gray-800/80 backdrop-blur-xl text-[10px] p-2 border-y border-white/5 flex flex-wrap justify-between items-center gap-2">
            {/* Action State */}
            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-bold text-indigo-400 uppercase tracking-tight hidden sm:inline">Core:</span>
                <span className="text-gray-300 truncate max-w-[120px] sm:max-w-none">{currentActionText}</span>
            </div>

            {/* Metrics & Actions */}
            <div className="flex items-center gap-2">
                {!isMobileView && (
                    <>
                        <button onClick={() => setIsRoutingModalOpen(true)} className="hover:text-indigo-400 p-1">Routes</button>
                        <button onClick={onAgentConfigClick} className="hover:text-orange-400 p-1 flex items-center gap-1"><UserCircleIcon className="w-3 h-3"/> Setup</button>
                        <div className="w-px h-3 bg-white/10" />
                    </>
                )}

                <button onClick={runCognitiveSynthesis} className="text-emerald-400 hover:text-white p-1" title="Synthesis">
                    <SparklesIcon className="w-4 h-4" />
                </button>

                {!isMobileView && (
                    <>
                         <button onClick={() => setLogPanelOpen(!isLogPanelOpen)} className={isLogPanelOpen ? 'text-indigo-400' : 'text-gray-500'} title="System Logs"><LogIcon className="w-3.5 h-3.5"/></button>
                         <button onClick={() => setToolInspectorOpen(true)} className={getStatusStyles(toolState.status)} title="Agent Logic Inspector"><WrenchScrewdriverIcon className="w-3 h-3"/></button>
                    </>
                )}

                {/* Memory Tier Monitors */}
                <div className="flex gap-1 items-center bg-black/20 p-0.5 rounded-lg border border-white/5">
                    <button onClick={() => setMemoryInspector('semantic')} className={getStatusStyles(memoryMonitor.semantic.status)} title="Semantic Memory (Pinecone)"><BrainIcon className="w-3 h-3"/></button>
                    <button onClick={() => setMemoryInspector('structured')} className={getStatusStyles(memoryMonitor.structured.status)} title="Structured Memory (Postgres/Upstash)"><CircleStackIcon className="w-3 h-3"/></button>
                    <button onClick={() => setMemoryInspector('graph')} className={getStatusStyles(memoryMonitor.graph.status)} title="Graph Memory (EdgeDB)"><LinkIcon className="w-3 h-3"/></button>
                    <button onClick={() => setMemoryInspector('episodic')} className={getStatusStyles(memoryMonitor.episodic.status)} title="Episodic Memory (Chat History)"><ClockIcon className="w-3 h-3"/></button>
                </div>

                <div className="w-px h-3 bg-white/10" />

                <button onClick={onSettingsClick} className="flex items-center gap-1 text-gray-400 hover:text-white">
                     <CogIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{model.split('-')[1]}</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
