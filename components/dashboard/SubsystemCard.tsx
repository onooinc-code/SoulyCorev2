
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { Subsystem } from '@/lib/types';
import { GitCommitIcon, GitPullRequestIcon, IssueOpenedIcon, SparklesIcon, WarningIcon } from '../Icons';

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
        <motion.div
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
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${subsystem.progress}%` }}></div>
                </div>
            </div>
            
            {/* Live Stats & Resources */}
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-800 p-2 rounded-md">
                    <h6 className="font-semibold text-gray-400 mb-1">Live GitHub Stats</h6>
                        <div className="flex justify-around items-center text-gray-300">
                        <a href={subsystem.githubStats.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white" title="Commits"><GitCommitIcon className="w-4 h-4"/>{subsystem.githubStats.commits}</a>
                        <a href={subsystem.githubStats.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white" title="Pull Requests"><GitPullRequestIcon className="w-4 h-4"/>{subsystem.githubStats.pullRequests}</a>
                        <a href={subsystem.githubStats.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white" title="Open Issues"><IssueOpenedIcon className="w-4 h-4"/>{subsystem.githubStats.issues}</a>
                    </div>
                </div>
                    <div className="bg-gray-800 p-2 rounded-md">
                    <h6 className="font-semibold text-gray-400 mb-1">Resources</h6>
                    <div className="flex gap-3">
                        {subsystem.resources.map(res => (
                            <a key={res.name} href={res.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{res.name}</a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <div className="bg-gray-800 p-2 rounded-md">
                    <h6 className="font-semibold text-gray-400 mb-2 text-xs">Key Milestones</h6>
                    <ul className="space-y-1">
                    {subsystem.milestones.map((ms, index) => (
                        <li key={index} className={`text-xs flex items-center gap-2 ${ms.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                            <input type="checkbox" checked={ms.completed} readOnly className="h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-indigo-600 focus:ring-0" />
                            <span>{ms.description}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-700">
                <button onClick={onOpenDetails} className="flex-1 text-center py-2 text-xs bg-gray-700 rounded-md hover:bg-gray-600">View Details</button>
                <button onClick={() => onAiAction(subsystem, 'summary')} className="flex-1 text-center py-2 text-xs bg-blue-600 rounded-md hover:bg-blue-500 flex items-center justify-center gap-1"><SparklesIcon className="w-4 h-4"/> AI Summary</button>
                <button onClick={() => onAiAction(subsystem, 'risk')} className="flex-1 text-center py-2 text-xs bg-yellow-600 rounded-md hover:bg-yellow-500 flex items-center justify-center gap-1"><WarningIcon className="w-4 h-4" /> Risk Assessment</button>
            </div>
        </motion.div>
    );
};

export default SubsystemCard;
