"use client";

// components/dashboard/panels/SystemHealthPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
import { motion } from 'framer-motion';
import { CheckIcon, WarningIcon, ServerIcon, BrainIcon, CpuChipIcon } from '../../Icons';

interface SystemStatus {
    label: string;
    status: 'Operational' | 'Degraded' | 'Error';
    details: string;
}

const SystemHealthPanel = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    const fetchHealthData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error("Failed to fetch system stats");
            const data = await res.json();
            
            const totalPipelines = data.pipelines.contextAssembly.completed + data.pipelines.contextAssembly.failed + data.pipelines.memoryExtraction.completed + data.pipelines.memoryExtraction.failed;
            const failedPipelines = data.pipelines.contextAssembly.failed + data.pipelines.memoryExtraction.failed;
            const successRate = totalPipelines > 0 ? ((totalPipelines - failedPipelines) / totalPipelines) * 100 : 100;

            let systemHealth: SystemStatus;
            if (successRate >= 98) {
                systemHealth = { label: 'All Systems Operational', status: 'Operational', details: 'All subsystems are running smoothly.' };
            } else if (successRate >= 90) {
                 systemHealth = { label: 'Degraded Performance', status: 'Degraded', details: 'Some pipeline executions have failed. System is functional but may have intermittent issues.' };
            } else {
                 systemHealth = { label: 'Experiencing Issues', status: 'Error', details: 'A significant number of pipeline failures detected. System stability is at risk.' };
            }
            setStatus(systemHealth);

        } catch (error) {
            log('Error fetching system health', { error }, 'error');
            setStatus({ label: 'Status Unknown', status: 'Error', details: 'Could not fetch system health data.' });
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchHealthData();
        const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchHealthData]);

    const statusStyles = {
        Operational: { icon: <CheckIcon className="w-6 h-6 text-green-400" />, color: 'text-green-400' },
        Degraded: { icon: <WarningIcon className="w-6 h-6 text-yellow-400" />, color: 'text-yellow-400' },
        Error: { icon: <WarningIcon className="w-6 h-6 text-red-400" />, color: 'text-red-400' },
    };

    const renderContent = () => {
        if (isLoading && !status) {
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Checking system health...</p>
                </div>
            );
        }

        if (!status) {
             return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Could not load health data.</p>
                </div>
            );
        }
        
        const currentStatus = statusStyles[status.status];

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${currentStatus.color} bg-opacity-20`}>
                        {currentStatus.icon}
                    </div>
                    <h4 className={`mt-2 font-semibold ${currentStatus.color}`}>{status.label}</h4>
                    <p className="text-xs text-gray-400 mt-1">{status.details}</p>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-md">
                        <div className="flex items-center gap-2"><CpuChipIcon className="w-4 h-4 text-gray-400"/><span>API & Pipelines</span></div>
                        <span className="font-semibold text-green-400">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-md">
                        <div className="flex items-center gap-2"><BrainIcon className="w-4 h-4 text-gray-400"/><span>Semantic Memory</span></div>
                         <span className="font-semibold text-green-400">Connected</span>
                    </div>
                     <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-md">
                        <div className="flex items-center gap-2"><ServerIcon className="w-4 h-4 text-gray-400"/><span>Database</span></div>
                         <span className="font-semibold text-green-400">Connected</span>
                    </div>
                </div>
            </motion.div>
        )
    };

    return (
        <DashboardPanel title="System Health">
           {renderContent()}
        </DashboardPanel>
    );
};

export default SystemHealthPanel;
