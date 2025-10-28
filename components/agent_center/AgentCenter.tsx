
"use client";

// components/agent_center/AgentCenter.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { AgentRun, AgentPlanPhase } from '@/lib/types';
import { useAppContext } from '@/lib/hooks/useAppContext';
import { motion, AnimatePresence } from 'framer-motion';
import RunReport from './RunReport';
import PlanDisplay from './PlanDisplay';
import EmptyState from '../ui/EmptyState';
import { RocketLaunchIcon } from '../Icons';

type ViewState = 'idle' | 'planning' | 'review' | 'executing';

const AgentCenter = () => {
    const { log, setStatus, clearError } = useAppContext();
    const [goal, setGoal] = useState('');
    const [runs, setRuns] = useState<AgentRun[]>([]);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewState, setViewState] = useState<ViewState>('idle');
    const [currentPlan, setCurrentPlan] = useState<Omit<AgentPlanPhase, 'id' | 'run_id' | 'steps' | 'result' | 'started_at' | 'completed_at'>[] | null>(null);


    const fetchRuns = useCallback(async () => {
        try {
            const res = await fetch('/api/agents/runs');
            if (!res.ok) throw new Error('Failed to fetch agent runs');
            const data = await res.json();
            setRuns(data);
        } catch (error) {
            log('Failed to fetch agent runs', { error }, 'error');
            setStatus({ error: (error as Error).message });
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchRuns();
    }, [fetchRuns]);

    const handleCreatePlan = async () => {
        if (!goal.trim()) return;
        setViewState('planning');
        setIsLoading(true);
        setStatus({ currentAction: 'Generating execution plan...' });
        log('Generating agent plan', { goal });
        try {
            const res = await fetch('/api/agents/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
            
            const planWithOrder = data.plan.map((p: any, index: number) => ({
                phase_order: index + 1,
                goal: p.goal,
                status: 'pending',
            }));

            setCurrentPlan(planWithOrder);
            setViewState('review');
        } catch (error) {
            log('Failed to generate plan', { error }, 'error');
            setStatus({ error: (error as Error).message });
            setViewState('idle');
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: '' });
        }
    };

    const handleExecutePlan = async () => {
        if (!currentPlan || !goal) return;
        setViewState('executing');
        setIsLoading(true);
        setStatus({ currentAction: 'Initiating agent run...' });
        log('User approved plan. Starting execution.', { goal, plan: currentPlan });

        try {
            const res = await fetch('/api/agents/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, plan: currentPlan }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to start agent run');
            }

            const newRun: AgentRun = await res.json();
            
            await fetchRuns();
            
            setActiveRunId(newRun.id); 
            
            setViewState('idle');
            setCurrentPlan(null);
            setGoal('');

        } catch (error) {
            log('Failed to execute plan', { error }, 'error');
            setStatus({ error: (error as Error).message });
            setViewState('review');
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: '' });
        }
    };
    
    const handleDiscardPlan = () => {
        setViewState('idle');
        setCurrentPlan(null);
        setGoal('');
        clearError();
    };

    const renderLeftPanel = () => {
        return (
            <>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">1. Define Goal</h3>
                    <p className="text-sm text-gray-400 mb-4">Define a high-level goal for the agent to achieve.</p>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., 'Research the top 3 AI frameworks...'"
                        className="w-full p-2 bg-gray-700 rounded-lg text-sm resize-y"
                        rows={4}
                        disabled={isLoading || viewState !== 'idle'}
                    />
                    <button
                        onClick={handleCreatePlan}
                        disabled={isLoading || !goal.trim() || viewState !== 'idle'}
                        className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {viewState === 'planning' ? 'Generating Plan...' : 'Create Plan'}
                    </button>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg flex-1 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-semibold mb-4">Run History</h3>
                     <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {runs.map(run => (
                            <button
                                key={run.id}
                                onClick={() => { if (viewState === 'idle') setActiveRunId(run.id) }}
                                disabled={viewState !== 'idle'}
                                className={`w-full text-left p-3 rounded-md transition-colors ${activeRunId === run.id && viewState === 'idle' ? 'bg-indigo-600/30' : 'bg-gray-700/50 hover:bg-gray-700'} disabled:cursor-not-allowed`}
                            >
                                <p className="font-semibold truncate">{run.goal}</p>
                                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                                    <span className={`capitalize px-2 py-0.5 rounded-full ${run.status === 'completed' ? 'bg-green-600/50 text-green-300' : run.status === 'failed' ? 'bg-red-600/50 text-red-300' : 'bg-yellow-600/50 text-yellow-300'}`}>{run.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    const renderRightPanel = () => {
        if (viewState === 'planning' || viewState === 'review' || viewState === 'executing') {
            return (
                 <PlanDisplay 
                    goal={goal}
                    plan={currentPlan}
                    state={viewState}
                    onApprove={handleExecutePlan}
                    onDiscard={handleDiscardPlan}
                    onReplan={handleCreatePlan}
                />
            );
        }

        return (
            <motion.div 
                key={activeRunId || 'empty'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                {activeRunId ? (
                    <RunReport runId={activeRunId} />
                ) : (
                    <EmptyState 
                        icon={RocketLaunchIcon}
                        title="Agent Center"
                        description="Select a past run from the history list, or define a new goal to begin an autonomous operation."
                    />
                )}
            </motion.div>
        )
    }

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Autonomous Agent Center</h2>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                <div className="col-span-4 flex flex-col gap-6">
                    {renderLeftPanel()}
                </div>

                <div className="col-span-8 bg-gray-800/50 rounded-lg overflow-hidden">
                    <AnimatePresence mode="wait">
                        {renderRightPanel()}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AgentCenter;
