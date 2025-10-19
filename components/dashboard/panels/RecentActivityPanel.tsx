// components/dashboard/panels/RecentActivityPanel.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
import type { LogEntry } from '../../providers/LogProvider';
import { InfoIcon, WarningIcon, ErrorIcon, CpuChipIcon } from '../../Icons';
import { motion, AnimatePresence } from 'framer-motion';

const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
};


const RecentActivityPanel = () => {
    const [activities, setActivities] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/logs/all');
            if (!res.ok) throw new Error("Failed to fetch recent activity");
            const data: LogEntry[] = await res.json();
            // Get the 5 most recent activities
            setActivities(data.slice(0, 5));
        } catch (error) {
            log('Error fetching recent activity', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const levelIcon: Record<LogEntry['level'], React.ReactNode> = {
        info: <InfoIcon className="w-4 h-4 text-blue-400" />,
        warn: <WarningIcon className="w-4 h-4 text-yellow-400" />,
        error: <ErrorIcon className="w-4 h-4 text-red-400" />,
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gray-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-700 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activities.length === 0) {
            return (
                <div className="text-center text-gray-500 py-8">
                    <CpuChipIcon className="w-8 h-8 mx-auto mb-2"/>
                    <p>No recent system activity.</p>
                </div>
            )
        }

        return (
             <div className="space-y-4">
                <AnimatePresence>
                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3"
                        >
                            <div className="mt-1 flex-shrink-0">{levelIcon[activity.level]}</div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-300">{activity.message}</p>
                                <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <DashboardPanel title="Recent Activity">
           {renderContent()}
        </DashboardPanel>
    );
};

export default RecentActivityPanel;
