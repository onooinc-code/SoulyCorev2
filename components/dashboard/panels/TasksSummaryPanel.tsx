// components/dashboard/panels/TasksSummaryPanel.tsx
"use client";

// FIX: Imported useState, useEffect, useCallback, and useMemo from React to resolve hook-related errors.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
import { useUIState } from '../../providers/UIStateProvider';
import type { Task } from '@/lib/types';
import { motion } from 'framer-motion';
import { TasksIcon, CheckIcon } from '../../Icons';

const TasksSummaryPanel = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setActiveView } = useUIState();
    const { log } = useLog();

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data: Task[] = await res.json();
            setTasks(data);
        } catch (error) {
            log('Error fetching tasks for summary panel', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const pendingTasks = useMemo(() => {
        return tasks.filter(task => task.status === 'todo' || task.status === 'in_progress');
    }, [tasks]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gray-700 rounded"></div>
                            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            );
        }

        if (pendingTasks.length === 0) {
            return (
                <div className="text-center text-gray-500 py-4">
                    <CheckIcon className="w-8 h-8 mx-auto mb-2 text-green-400"/>
                    <p className="font-semibold">All tasks completed!</p>
                    <p className="text-xs">No pending tasks at the moment.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <p className="text-sm text-gray-400 mb-3">
                    You have <span className="font-bold text-indigo-300">{pendingTasks.length}</span> pending task(s).
                </p>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {pendingTasks.slice(0, 4).map(task => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-md"
                        >
                            <TasksIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300 truncate">{task.title}</span>
                        </motion.div>
                    ))}
                </div>
                <button 
                    onClick={() => setActiveView('tasks_hub')}
                    className="mt-3 w-full text-center py-2 text-xs bg-indigo-600/50 rounded-md font-semibold hover:bg-indigo-600/80 transition-colors"
                >
                    View All Tasks
                </button>
            </div>
        );
    };

    return (
        <DashboardPanel title="Tasks Summary">
            {renderContent()}
        </DashboardPanel>
    );
};

export default TasksSummaryPanel;