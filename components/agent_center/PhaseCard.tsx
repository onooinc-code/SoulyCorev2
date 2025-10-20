"use client";

// components/agent_center/PhaseCard.tsx
import React from 'react';
import type { AgentPlanPhase } from '@/lib/types';
import { motion } from 'framer-motion';
import { CheckIcon, MinusIcon, SparklesIcon } from '../Icons';

interface PhaseCardProps {
    phase: Omit<AgentPlanPhase, 'id' | 'run_id' | 'steps' | 'result' | 'started_at' | 'completed_at'>;
    isActive: boolean;
}

const statusInfo: Record<AgentPlanPhase['status'], { icon: React.ReactNode, color: string }> = {
    pending: { icon: <MinusIcon className="w-4 h-4" />, color: 'text-gray-400' },
    running: { icon: <SparklesIcon className="w-4 h-4 animate-pulse" />, color: 'text-yellow-400' },
    completed: { icon: <CheckIcon className="w-4 h-4" />, color: 'text-green-400' },
    failed: { icon: <CheckIcon className="w-4 h-4" />, color: 'text-red-400' },
};

const PhaseCard = ({ phase, isActive }: PhaseCardProps) => {
    const status = statusInfo[isActive ? 'running' : phase.status];
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`bg-gray-900/50 p-3 rounded-lg border-2 ${isActive ? 'border-indigo-500' : 'border-transparent'}`}
        >
            <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 font-bold ${status.color}`}>
                    {status.icon}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-300">Phase {phase.phase_order}</p>
                    <p className="text-sm text-gray-400">{phase.goal}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default PhaseCard;
