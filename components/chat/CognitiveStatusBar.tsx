
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BeakerIcon } from '../Icons';
import { CognitiveStatus, CognitivePhase } from '@/lib/types';

interface CognitiveStatusBarProps {
    status: CognitiveStatus;
    onInspect: () => void;
}

const CognitiveStatusBar = ({ status, onInspect }: CognitiveStatusBarProps) => {
    // All available phases including the new reasoning and acting states
    const phases: CognitivePhase[] = ['retrieving', 'assembling', 'reasoning', 'acting', 'prompting', 'generating'];
    const currentPhaseIndex = phases.indexOf(status.phase);

    return (
        <div className="bg-gray-800/80 backdrop-blur-md border-t border-b border-white/10 p-2 text-xs flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <span className="font-bold text-indigo-300">Cognitive Process:</span>
                <div className="flex-1 flex items-center gap-2">
                    {phases.map((phase, index) => (
                        <div key={phase} className="flex-1 flex flex-col items-center">
                            <div className="relative w-full h-1 bg-gray-700 rounded-full">
                                <motion.div
                                    className={`absolute top-0 left-0 h-full rounded-full ${index === currentPhaseIndex ? 'bg-yellow-400' : 'bg-indigo-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ 
                                        width: index < currentPhaseIndex ? '100%' : index === currentPhaseIndex ? '50%' : '0%' 
                                    }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                />
                            </div>
                            <span className={`mt-1 text-[8px] uppercase tracking-tighter ${index <= currentPhaseIndex ? 'text-gray-300 font-bold' : 'text-gray-600'}`}>{phase}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
                <p className="text-gray-400 italic animate-pulse truncate max-w-[200px]">{status.details}</p>
                <button 
                    onClick={onInspect}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 text-gray-300 shrink-0"
                    title="Inspect the detailed cognitive process for this response"
                >
                    <BeakerIcon className="w-4 h-4"/>
                    <span>Inspect</span>
                </button>
            </div>
        </div>
    );
};

export default CognitiveStatusBar;
