
"use client";

import React, { useMemo, useState } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { CogIcon, ClockIcon, WrenchScrewdriverIcon, LogIcon, RocketLaunchIcon, BrainIcon, CircleStackIcon, LinkIcon, UserCircleIcon, SparklesIcon, CpuChipIcon } from '@/components/Icons';
import type { CognitiveStatus, ExecutionStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: StatusBarProps) => {
    const { status, currentConversation, toolState, memoryMonitor, runCognitiveSynthesis } = useConversation();
    const { setLogPanelOpen, isLogPanelOpen, setToolInspectorOpen, setActiveView, setMemoryInspector, setProfileModalOpen } = useUIState();
    const [showUsageLog, setShowUsageLog] = useState(false);
    
    const model = useMemo(() => currentConversation?.model || 'gemini-3-flash-preview', [currentConversation]);

    const getStatusStyles = (status: ExecutionStatus) => {
        const base = "flex items-center gap-1 transition-all duration-300 px-2 py-0.5 rounded-full border ";
        switch (status) {
            case 'executing': return base + "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse";
            case 'success': return base + "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse";
            case 'null': return base + "bg-amber-500/20 text-amber-400 border-amber-500/50";
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
                    <span className="font-bold uppercase tracking-widest">Cognitive Core</span>
                </div>
                <span className="italic truncate">{currentActionText}</span>
            </div>

            <div className="flex items-center gap-3">
                 {/* Synthesis Trigger */}
                <button 
                    onClick={runCognitiveSynthesis}
                    className="flex items-center gap-1 text-emerald-400 hover:text-white bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 transition-all hover:scale-105"
                    title="Run Cognitive Synthesis (Link memory tiers)"
                >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline font-bold">Synthesize</span>
                </button>

                <div className="h-3 w-px bg-white/10 mx-1" />

                <button onClick={() => setLogPanelOpen(!isLogPanelOpen)} className={`flex items-center gap-1 ${isLogPanelOpen ? 'text-indigo-400' : 'hover:text-white'}`} title="Debug Logs">
                    <LogIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Logs</span>
                </button>

                 <button onClick={() => setToolInspectorOpen(true)} className={getStatusStyles(toolState.status)} title="True ReAct Agent Status">
                    <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Agent Loop</span>
                </button>

                <div className="h-3 w-px bg-white/10 mx-1 hidden md:block" />

                {/* Memory Tier Monitors */}
                <button onClick={() => setMemoryInspector('semantic')} className={getStatusStyles(memoryMonitor.semantic.status)} title="Semantic Memory">
                    <BrainIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Semantic</span>
                </button>
                <button onClick={() => setMemoryInspector('structured')} className={getStatusStyles(memoryMonitor.structured.status)} title="Structured Memory">
                    <CircleStackIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Structured</span>
                </button>
                <button onClick={() => setMemoryInspector('graph')} className={getStatusStyles(memoryMonitor.graph.status)} title="Graph Memory">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Graph</span>
                </button>
                <button onClick={() => setMemoryInspector('episodic')} className={getStatusStyles(memoryMonitor.episodic.status)} title="Episodic Memory">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Episodic</span>
                </button>

                <div className="h-3 w-px bg-white/10 mx-1 hidden md:block" />

                {/* AI Usage Counter */}
                <div 
                    className="relative flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 cursor-help group"
                    onMouseEnter={() => setShowUsageLog(true)}
                    onMouseLeave={() => setShowUsageLog(false)}
                >
                    <CpuChipIcon className="w-3 h-3" />
                    <span className="font-bold">{status.aiCallCount} Calls</span>
                    
                    <AnimatePresence>
                        {showUsageLog && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: -5 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 border border-purple-500/30 rounded-lg p-2 shadow-2xl z-50 overflow-hidden"
                            >
                                <p className="text-[9px] font-bold text-gray-500 mb-2 border-b border-white/5 pb-1 uppercase tracking-widest">AI Access Log</p>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                    {status.callLog.length > 0 ? [...status.callLog].reverse().map((log, i) => (
                                        <div key={i} className="flex justify-between items-center text-[8px] font-mono">
                                            <span className="text-indigo-400">{log.origin.substring(0,6)}..</span>
                                            <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    )) : <p className="text-[8px] text-gray-600 italic">No calls recorded.</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-3 w-px bg-white/10 mx-1 hidden md:block" />

                <button onClick={() => setProfileModalOpen(true)} className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors" title="User Persona">
                    <UserCircleIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Identity</span>
                </button>

                <button onClick={onSettingsClick} className="flex items-center gap-1 hover:text-white transition-colors">
                     <CogIcon className="w-3.5 h-3.5" />
                    <span>{model.split('-').slice(0,2).join(' ')}</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
