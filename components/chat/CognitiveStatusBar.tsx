
"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { CognitivePhase, IStatus } from '@/lib/types';
import { BrainIcon, CpuChipIcon, SendIcon, SparklesIcon, BeakerIcon, CheckIcon } from '../Icons';

interface CognitiveStatusBarProps {
    status: { phase: CognitivePhase; details: string };
    onInspect: () => void;
}

const CognitiveStatusBar = ({ status, onInspect }: CognitiveStatusBarProps) => {

    const phases: { id: CognitivePhase; label: string; icon: React.FC<any>; tooltip: string }[] = [
        { id: 'retrieving', label: 'Retrieve', icon: BrainIcon, tooltip: 'Querying long-term memory for relevant facts and context.' },
        { id: 'assembling', label: 'Assemble', icon: CpuChipIcon, tooltip: 'Constructing the final context from retrieved memories.' },
        { id: 'prompting', label: 'Prompt', icon: SendIcon, tooltip: 'Sending the optimized prompt and context to the AI model.' },
        { id: 'generating', label: 'Generate', icon: SparklesIcon, tooltip: 'Receiving and processing the response from the AI model.' },
    ];

    const currentPhaseIndex = useMemo(() => phases.findIndex(p => p.id === status.phase), [status.phase, phases]);

    return (
        <div className="bg-gray-800/80 backdrop-blur-sm text-gray-400 text-xs p-2 border-t border-white/10 flex justify-between items-center gap-4">
            <div className="flex-1 flex items-center gap-4 relative">
                {phases.map((phase, index) => {
                    const isCompleted = index < currentPhaseIndex;
                    const isActive = index === currentPhaseIndex;

                    return (
                        <div key={phase.id} title={isActive ? `${phase.tooltip}\nDetails: ${status.details}` : phase.tooltip} className="flex items-center gap-1.5 transition-colors duration-300">
                            {isCompleted ? (
                                <CheckIcon className="w-4 h-4 text-green-400" />
                            ) : (
                                <phase.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 animate-pulse' : 'text-gray-500'}`} />
                            )}
                            <span className={`${isActive ? 'text-white font-semibold' : isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                                {phase.label}
                            </span>
                        </div>
                    );
                })}
                 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -z-10">
                    <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(currentPhaseIndex / (phases.length -1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>
            </div>
            
            <div className="flex-shrink-0">
                 <button onClick={onInspect} className="flex items-center gap-1.5 px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-full" title="Inspect the cognitive process for the last message.">
                    <BeakerIcon className="w-4 h-4" />
                    <span>Inspect</span>
                </button>
            </div>
        </div>
    );
};

export default CognitiveStatusBar;
