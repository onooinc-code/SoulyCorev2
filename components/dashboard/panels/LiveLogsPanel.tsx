"use client";

// components/dashboard/panels/LiveLogsPanel.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import type { LogEntry } from '../../providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoIcon, WarningIcon, ErrorIcon } from '../../Icons';

const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);

    if (seconds < 60) return `${seconds}s ago`;
    return `${minutes}m ago`;
};

const LiveLogsPanel = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setLogPanelOpen } = useUIState();
    const { log } = useLog(); // Main log function from provider

    const fetchLogs = useCallback(async () => {
        if(logs.length === 0) setIsLoading(true);
        try {
            const res = await fetch('/api/logs/all');
            if (res.ok) {
                const data: LogEntry[] = await res.json();
                setLogs(data.slice(0, 15)); // Keep only the latest 15 logs
            }
        } catch (error) {
            log('Error fetching logs for live panel', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log, logs.length]);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const levelInfo: Record<LogEntry['level'], { icon: React.ReactNode; color: string }> = {
        info: { icon: <InfoIcon className="w-3 h-3" />, color: 'text-blue-400' },
        warn: { icon: <WarningIcon className="w-3 h-3" />, color: 'text-yellow-400' },
        error: { icon: <ErrorIcon className="w-3 h-3" />, color: 'text-red-400' },
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center text-xs text-gray-500 py-4">Loading logs...</div>;
        }

        if (logs.length === 0) {
            return <div className="text-center text-xs text-gray-500 py-4">No log entries found.</div>;
        }

        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 font-mono text-xs">
                     <AnimatePresence>
                        {logs.map((entry, index) => {
                            const info = levelInfo[entry.level];
                            return (
                                <motion.div
                                    key={entry.id || `${entry.timestamp}-${index}`}
                                    layout
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-start gap-2"
                                >
                                    <span className={`mt-0.5 ${info.color}`}>{info.icon}</span>
                                    <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                    <p className={`flex-1 break-all ${info.color}`}>{entry.message}</p>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
                 <button 
                    onClick={() => setLogPanelOpen(true)}
                    className="mt-2 w-full text-center py-1.5 text-xs bg-indigo-600/30 rounded-md font-semibold hover:bg-indigo-600/50 transition-colors"
                >
                    View Full Log
                </button>
            </div>
        );
    };

    return (
        <DashboardPanel title="Live Logs">
           {renderContent()}
        </DashboardPanel>
    );
};

export default LiveLogsPanel;
