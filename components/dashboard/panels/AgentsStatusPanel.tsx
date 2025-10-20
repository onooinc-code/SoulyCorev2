"use client";

// components/dashboard/panels/AgentsStatusPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
// FIX: Corrected relative import path to use the `@` alias.
import { useUIState } from '@/components/providers/UIStateProvider';
import type { AgentRun } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, SparklesIcon, RocketLaunchIcon } from '../../Icons';

const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
};

const AgentsStatusPanel = () => {
    const [runs, setRuns] = useState<AgentRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setActiveView } = useUIState();
    const { log } = useLog();

    const fetchRuns = useCallback(async () => {
        // Don't show loader on background refresh
        if (runs.length === 0) setIsLoading(true);
        try {
            const res = await fetch('/api/agents/runs');
            if (!res.ok) throw new Error("Failed to fetch agent runs");
            const data: AgentRun[] = await res.json();
            setRuns(data.slice(0, 4)); // Get the 4 most recent runs
        } catch (error) {
            log('Error fetching agent runs for status panel', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log, runs.length]);

    useEffect(() => {
        fetchRuns();
        const interval = setInterval(fetchRuns, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchRuns]);

    const statusInfo: Record<AgentRun['status'], { icon: React.ReactNode; color: string }> = {
        running: { icon: <SparklesIcon className="w-4 h-4" />, color: 'text-yellow-400' },
        completed: { icon: <CheckIcon className="w-4 h-4" />, color: 'text-green-400' },
        failed: { icon: <XIcon className="w-4 h-4" />, color: 'text-red-400' },
        planning: { icon: <SparklesIcon className="w-4 h-4" />, color: 'text-blue-400' },
        awaiting_approval: { icon: <SparklesIcon className="w-4 h-4" />, color: 'text-orange-400' },
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-md">
                            <div className="w-5 h-5 bg-gray-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (runs.length === 0) {
            return (
                <div className="text-center text-gray-500 py-4">
                    <RocketLaunchIcon className="w-8 h-8 mx-auto mb-2"/>
                    <p className="font-semibold">No agent runs recorded.</p>
                    <p className="text-xs">Run an agent from the Agent Center.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <div className="space-y-2 flex-1">
                    <AnimatePresence>
                        {runs.map(run => (
                            <motion.div
                                key={run.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-2 bg-gray-900/50 rounded-md"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 ${statusInfo[run.status]?.color || 'text-gray-400'}`}>
                                        {statusInfo[run.status]?.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300 truncate">{run.goal}</p>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {run.status.replace(/_/g, ' ')} - {getRelativeTime(run.createdAt.toString())}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                 <button 
                    onClick={() => setActiveView('agent_center')}
                    className="mt-3 w-full text-center py-2 text-xs bg-indigo-600/50 rounded-md font-semibold hover:bg-indigo-600/80 transition-colors"
                >
                    Go to Agent Center
                </button>
            </div>
        );
    };

    return (
        <DashboardPanel title="Agents Status">
            {renderContent()}
        </DashboardPanel>
    );
};

export default AgentsStatusPanel;
