
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
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${subsystem.progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700/50">
                <div className="flex gap-3">
                    <span className="flex items-center gap-1"><GitCommitIcon className="w-3 h-3"/> {subsystem.githubStats.commits}</span>
                    <span className="flex items-center gap-1"><GitPullRequestIcon className="w-3 h-3"/> {subsystem.githubStats.pullRequests}</span>
                    <span className="flex items-center gap-1"><IssueOpenedIcon className="w-3 h-3"/> {subsystem.githubStats.issues}</span>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onAiAction(subsystem, 'risk'); }}
                        className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors" 
                        title="AI Risk Assessment"
                    >
                        <WarningIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAiAction(subsystem, 'summary'); }}
                        className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors" 
                        title="AI Summary"
                    >
                        <SparklesIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenDetails(); }}
                className="w-full mt-2 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
            >
                View Details
            </button>
        </MotionDiv>
    );
};

export default SubsystemCard;
