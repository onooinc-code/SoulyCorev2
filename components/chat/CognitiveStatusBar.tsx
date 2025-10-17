"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon, BeakerIcon } from '../Icons';
import CognitivePhasePopover from './CognitivePhasePopover';

interface CognitivePhase {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

interface CognitiveStatus {
    currentPhase: string;
    phases: CognitivePhase[];
}

interface CognitiveStatusBarProps {
    status: CognitiveStatus;
    onInspect: () => void;
}

const CognitiveStatusBar = ({ status, onInspect }: CognitiveStatusBarProps) => {
    const [popoverPhase, setPopoverPhase] = useState<CognitivePhase | null>(null);
    const [popoverTarget, setPopoverTarget] = useState<HTMLElement | null>(null);

    const handleMouseEnter = (phase: CognitivePhase, event: React.MouseEvent<HTMLDivElement>) => {
        setPopoverPhase(phase);
        setPopoverTarget(event.currentTarget);
    };

    const handleMouseLeave = () => {
        setPopoverPhase(null);
        setPopoverTarget(null);
    };

    return (
        <div className="bg-gray-800/80 backdrop-blur-md border-t border-gray-700 p-2 text-xs text-gray-400">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-2">
                    <CpuChipIcon className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="font-semibold">{status.currentPhase}...</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        {status.phases.map((phase, index) => {
                            const phaseColors = {
                                pending: 'bg-gray-600',
                                running: 'bg-yellow-500 animate-pulse',
                                completed: 'bg-green-500',
                                failed: 'bg-red-500',
                            };
                            return (
                                <div
                                    key={index}
                                    onMouseEnter={(e) => handleMouseEnter(phase, e)}
                                    onMouseLeave={handleMouseLeave}
                                    className={`w-3 h-3 rounded-full transition-colors ${phaseColors[phase.status]}`}
                                    title={`${phase.name}: ${phase.status}`}
                                />
                            );
                        })}
                    </div>
                    <button onClick={onInspect} className="flex items-center gap-1.5 hover:bg-gray-700 p-1 rounded-md">
                        <BeakerIcon className="w-4 h-4" />
                        <span>Inspect</span>
                    </button>
                </div>
            </div>
            {popoverPhase && popoverTarget && (
                <CognitivePhasePopover
                    phase={popoverPhase}
                    target={popoverTarget}
                    onClose={() => setPopoverPhase(null)}
                />
            )}
        </div>
    );
};

export default CognitiveStatusBar;
