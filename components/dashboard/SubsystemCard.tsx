
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { Subsystem } from '@/lib/types';
import { GitCommitIcon, GitPullRequestIcon, IssueOpenedIcon, SparklesIcon, WarningIcon } from '../Icons';

const MotionDiv = motion.div as any;

interface SubsystemCardProps {
    subsystem: Subsystem;
    onOpenDetails: () => void;
    onAiAction: (subsystem: Subsystem, action: 'summary' | 'risk') => void;
}

const healthColorMap: Record<string, { bg: string; text: string; }> = {
    'A+': { bg: 'bg-green-500', text: 'text-green-100' },
    'A': { bg: 'bg-green-600', text: 'text-green-200' },
    'B': { bg: 'bg-yellow-500', text: 'text-yellow-100' },
    'C': { bg: 'bg-orange-500', text: 'text-orange-100' },
    'D': { bg: 'bg-red-500', text: 'text-red-100' },
    'F': { bg: 'bg-red-600', text: 'text-red-100' },
};

const SubsystemCard = ({ subsystem, onOpenDetails, onAiAction }: SubsystemCardProps) => {
    const healthStyle = healthColorMap[subsystem.healthScore];
    return (
        // FIX: Replaced `Reorder.Item` with `motion.div` to fix an incorrect usage pattern. The parent component (`HedraGoalsPanel`) is now responsible for wrapping this component in `Reorder.Item` for drag-and-drop functionality.
        <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3 cursor-grab active:cursor-grabbing"
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h5 className="font-bold text-white">{subsystem.name}</h5>
                    <p className="text-xs text-gray-400">{subsystem.description}</p>
                </div>
                <div className={`px-2 py-1 text-xs font-bold rounded ${healthStyle.bg} ${healthStyle.text}`}>
                    Health: {subsystem.healthScore}
                </div>
            </div>

            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-300">Progress</span>
                    <span className="text-indigo-300">{subsystem.progress}%</span>
