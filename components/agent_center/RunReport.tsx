
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentRun, AgentRunStep, AgentPlanPhase } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, CheckIcon, XIcon, LightbulbIcon, ServerIcon, ClockIcon } from '../Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RunReportProps {
    runId: string;
}

const Step = ({ step }: { step: AgentRunStep }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 p-3 rounded-lg"
    >
        <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-indigo-300">{step.step_order}</div>
            </div>
            <div className="flex-1">
                {step.thought && (
                    <div className="flex items-start gap-2 text-sm text-gray-400 mb-2">
                        <LightbulbIcon className="w-4 h-4 mt-1 flex-shrink-0 text-yellow-400"/>
                        <p className="italic">{step.thought}</p>
                    </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                    <ServerIcon className="w-4 h-4 mt-1 flex-shrink-0 text-cyan-400"/>
                    <div>
                        <p className="font-semibold text-gray-300">Action: <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded-md text-cyan-300">{step.action_type}</span></p>
                        {step.action_input && <pre className="text-xs mt-1 bg-gray-800 p-2 rounded-md whitespace-pre-wrap"><code>{JSON.stringify(step.action_input, null, 2)}</code></pre>}
                    </div>
                </div>
                {step.observation && (
                     <div className="mt-2 text-sm pl-6 border-l-2 border-dashed border-gray-600 ml-2">
                        <p className="font-semibold text-gray-300 mb-1">Observation:</p>
                        <div className="prose-custom text-xs bg-gray-800 p-2 rounded-md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{step.observation}</ReactMarkdown></div>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

const PhaseReport = ({ phase }: { phase: AgentPlanPhase }) => {
    const phaseStatusInfo: Record<AgentPlanPhase['status'], { icon: React.ReactNode; color: string }> = {
        pending: { icon: <ClockIcon className="w-5 h-5" />, color: 'text-gray-400' },
        running: { icon: <SparklesIcon className="w-5 h-5 animate-pulse" />, color: 'text-yellow-400' },
        completed: { icon: <CheckIcon className="w-5 h-5" />, color: 'text-green-400' },
        failed: { icon: <XIcon className="w-5 h-5" />, color: 'text-red-400' },
    };
    const status = phaseStatusInfo[phase.status];

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/50 p-4 rounded-lg"
        >
            <div className="flex items-center gap-3 border-b border-gray-700 pb-2 mb-3">
                <div className={`p-1.5 rounded-full ${status.color}`}>{status.icon}</div>
                <div>
                    <h4 className="font-semibold text-gray-200">Phase {phase.phase_order}</h4>
                    <p className="text-sm text-gray-400">{phase.goal}</p>
                </div>
            </div>
            <AnimatePresence>
                <div className="space-y-4">
                    {phase.steps?.map(step => <div key={step.id}><Step step={step} /></div>)}
                </div>
            </AnimatePresence>
        </motion.div>
    )
};


const RunReport = ({ runId }: RunReportProps) => {
    const { log } = useLog();
    const [run, setRun] = useState<AgentRun | null>(null);
    const [phasesWithSteps, setPhasesWithSteps] = useState<AgentPlanPhase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState('0s');
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        if (!runId) {
            setRun(null);
            setPhasesWithSteps([]);
            setIsLoading(false);
            return;
        }

        const poll = async () => {
            try {
                const res = await fetch(`/api/agents/runs/${runId}`);
                if (!res.ok) {
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    throw new Error('Failed to fetch run details');
                }
                const data: {run: AgentRun, phases: AgentPlanPhase[], steps: AgentRunStep[]} = await res.json();
                setRun(data.run);
                
                // Group steps by phase
                const stepsByPhaseId = data.steps.reduce((acc, step) => {
                    if (step.phase_id) {
                        if (!acc[step.phase_id]) acc[step.phase_id] = [];
                        acc[step.phase_id].push(step);
                    }
                    return acc;
                }, {} as Record<string, AgentRunStep[]>);

                const updatedPhases = data.phases.map(phase => ({
                    ...phase,
                    steps: stepsByPhaseId[phase.id] || [],
                }));

                setPhasesWithSteps(updatedPhases);
                
                if (data.run.status === 'completed' || data.run.status === 'failed') {
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                }
            } catch (error) {
                log('Polling failed', { error, runId }, 'error');
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            } finally {
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        poll(); 
        
        pollingIntervalRef.current = setInterval(poll, 2000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [runId, log]);

     useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (run?.status === 'running') {
            timer = setInterval(() => {
                const start = new Date(run.createdAt).getTime();
                const now = Date.now();
                const diffSeconds = Math.round((now - start) / 1000);
                setElapsedTime(`${diffSeconds}s`);
            }, 1000);
        } else if (run?.duration_ms) {
            setElapsedTime(`${(run.duration_ms / 1000).toFixed(2)}s`);
        }
        return () => clearInterval(timer);
    }, [run]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full text-gray-400">Loading run report...</div>;
    }

    if (!run) {
        return <div className="flex items-center justify-center h-full text-gray-500">Could not find data for this run.</div>;
    }

    const statusInfoMap: Record<AgentRun['status'], { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; label: string }> = {
        planning: { icon: SparklesIcon, color: 'text-blue-400', label: 'Planning' },
        awaiting_approval: { icon: ClockIcon, color: 'text-orange-400', label: 'Awaiting Approval' },
        running: { icon: SparklesIcon, color: 'text-yellow-400', label: 'Running' },
        completed: { icon: CheckIcon, color: 'text-green-400', label: 'Completed' },
        failed: { icon: XIcon, color: 'text-red-400', label: 'Failed' },
    };

    const statusInfo = statusInfoMap[run.status];
    const completedPhases = phasesWithSteps.filter(p => p.status === 'completed').length;
    const totalPhases = phasesWithSteps.length;
    const totalSteps = phasesWithSteps.reduce((acc, p) => acc + (p.steps?.length || 0), 0);
    const progressPercentage = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    return (
        <div className="h-full flex flex-col">
            <header className="flex-shrink-0 border-b border-gray-700 pb-3 mb-3">
                <p className="text-xs text-gray-500">Goal</p>
                <h3 className="font-semibold text-lg text-gray-200">{run.goal}</h3>
                <div className="flex items-center gap-4 text-sm mt-2">
                    {statusInfo && (
                        <div className={`flex items-center gap-1.5 font-semibold ${statusInfo.color}`}>
                            <statusInfo.icon className="w-5 h-5"/>
                            <span>{statusInfo.label}</span>
                        </div>
                    )}
                    <span className="text-gray-400">Phases: {completedPhases} / {totalPhases}</span>
                    <span className="text-gray-400">Steps: {totalSteps}</span>
                    <span className="text-gray-400">Elapsed: {elapsedTime}</span>
                </div>
                 <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <AnimatePresence>
                    {phasesWithSteps.map(phase => (
                        <div key={phase.id}><PhaseReport phase={phase} /></div>
                    ))}
                </AnimatePresence>

                {(run.status === 'completed' || run.status === 'failed') && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-900 p-4 rounded-lg mt-4"
                    >
                         <h4 className="text-md font-semibold text-gray-300 mb-2">Final Result</h4>
                         <div className="prose-custom max-w-none text-sm">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.final_result || (run.status === 'failed' ? 'The agent failed to complete the goal.' : 'The agent did not produce a final result.')}</ReactMarkdown>
                         </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RunReport;
