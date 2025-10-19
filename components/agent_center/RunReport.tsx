// components/agent_center/RunReport.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { AgentRun, AgentRunStep, AgentPlanPhase } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, SparklesIcon, RefreshIcon } from '../Icons';

const StepDisplay = ({ step }: { step: AgentRunStep }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 p-3 rounded-lg text-xs font-mono"
    >
        <p><strong className="text-purple-400">Thought:</strong> {step.thought}</p>
        <p className="mt-2"><strong className="text-cyan-400">Action:</strong> {step.action}({JSON.stringify(step.action_input)})</p>
        <p className="mt-2"><strong className="text-green-400">Observation:</strong> {step.observation}</p>
    </motion.div>
);


const PhaseDisplay = ({ phase, steps }: { phase: AgentPlanPhase, steps: AgentRunStep[] }) => {
    const statusInfo: Record<string, { icon: React.ReactNode, color: string }> = {
        pending: { icon: <SparklesIcon className="w-4 h-4" />, color: 'text-gray-400' },
        running: { icon: <SparklesIcon className="w-4 h-4 animate-pulse" />, color: 'text-yellow-400' },
        completed: { icon: <CheckIcon className="w-4 h-4" />, color: 'text-green-400' },
        failed: { icon: <XIcon className="w-4 h-4" />, color: 'text-red-400' },
    };

    const sInfo = statusInfo[phase.status];

    return (
        <div className="border border-gray-700 rounded-lg">
            <header className={`flex items-center gap-3 p-3 border-b border-gray-700 ${sInfo.color}`}>
                {sInfo.icon}
                <h4 className="font-semibold text-sm">Phase {phase.phase_order}: {phase.goal}</h4>
                <span className="ml-auto text-xs capitalize">{phase.status}</span>
            </header>
            <div className="p-3 space-y-2">
                <AnimatePresence>
                    {steps.map(step => (
                        <div key={step.id}>
                            <StepDisplay step={step} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
            {phase.result && (
                <footer className="p-3 border-t border-gray-700 text-xs">
                    <strong>Phase Result:</strong> {phase.result}
                </footer>
            )}
        </div>
    );
};

interface RunData {
    run: AgentRun;
    phases: AgentPlanPhase[];
    steps: AgentRunStep[];
}

const RunReport = ({ runId }: { runId: string }) => {
    const { log } = useLog();
    const [runData, setRunData] = useState<RunData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRunDetails = useCallback(async () => {
        if (!runId) return;
        if (runData?.run.status !== 'running') setIsLoading(true); // only full load if not running
        
        try {
            const res = await fetch(`/api/agents/runs/${runId}`);
            if (!res.ok) throw new Error('Failed to fetch run details');
            const data = await res.json();
            setRunData(data);
        } catch (error) {
            log('Error fetching run details', { error, runId }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [runId, log, runData?.run.status]);

    useEffect(() => {
        fetchRunDetails();
        const interval = setInterval(() => {
            if (runData?.run.status === 'running') {
                fetchRunDetails();
            }
        }, 2000); // Poll every 2 seconds if running
        return () => clearInterval(interval);
    }, [fetchRunDetails, runData?.run.status]);

    if (isLoading) {
        return <div className="p-6 text-center">Loading run report...</div>;
    }
    if (!runData) {
        return <div className="p-6 text-center text-red-400">Could not load data for this run.</div>;
    }

    const { run, phases, steps } = runData;
    
    return (
        <div className="h-full flex flex-col p-4">
            <header className="flex-shrink-0 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500">Main Goal</p>
                        <h3 className="font-semibold text-lg text-gray-200">{run.goal}</h3>
                    </div>
                    <button onClick={fetchRunDetails} className="p-2 bg-gray-700/50 rounded-full hover:bg-gray-700"><RefreshIcon className="w-5 h-5"/></button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {phases.map(phase => (
                    <div key={phase.id}>
                        <PhaseDisplay phase={phase} steps={steps.filter(s => s.phase_id === phase.id)} />
                    </div>
                ))}
            </div>
            {run.status === 'completed' || run.status === 'failed' ? (
                <footer className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="font-semibold">Final Result</h4>
                    <p className={`text-sm mt-1 p-2 rounded-md ${run.status === 'completed' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        {run.result_summary}
                    </p>
                </footer>
            ) : null}
        </div>
    );
};

export default RunReport;
