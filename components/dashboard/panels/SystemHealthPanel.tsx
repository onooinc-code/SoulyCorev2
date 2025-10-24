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
        const interval = setInterval(fetchHealthData, 30000); // Re-check every 30 seconds
        return () => clearInterval(interval);
    }, [fetchHealthData]);

    const statusInfo = {
        Operational: { icon: CheckIcon, color: 'text-green-400', ring: 'ring-green-500' },
        Degraded: { icon: WarningIcon, color: 'text-yellow-400', ring: 'ring-yellow-500' },
        Error: { icon: WarningIcon, color: 'text-red-400', ring: 'ring-red-500' },
    };
    
    const Indicator = ({ icon: Icon, label, status }: { icon: React.FC<any>, label: string, status: 'Operational' | 'Degraded' | 'Error' }) => (
        <div className="flex items-center gap-2 text-sm">
            <Icon className={`w-4 h-4 ${statusInfo[status].color}`} />
            <span className="text-gray-300">{label}</span>
        </div>
    );


    if (isLoading || !status) {
        return <DashboardPanel title="System Health"><div className="animate-pulse p-4 text-center">Checking system status...</div></DashboardPanel>;
    }

    const { icon: StatusIcon, color, ring } = statusInfo[status.status];

    return (
        <DashboardPanel title="System Health">
            <div className="flex flex-col items-center justify-center h-full text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center bg-gray-900/50 ring-4 ${ring}`}
                >
                    <StatusIcon className={`w-12 h-12 ${color}`} />
                </motion.div>
                <h4 className={`font-bold text-lg mt-4 ${color}`}>{status.label}</h4>
                <p className="text-xs text-gray-400 mt-1">{status.details}</p>
            </div>
        </DashboardPanel>
    );
};

export default SystemHealthPanel;