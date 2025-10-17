"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CopyIcon, CheckIcon } from '../Icons';
import type { CognitivePhase } from '@/lib/types';

interface PopoverProps {
    phase: CognitivePhase;
    target: HTMLElement;
    onClose: () => void;
}

const StatItem = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">{label}:</span>
        <span className="font-semibold text-white">{value}</span>
    </div>
);

const CognitivePhasePopover = ({ phase, target, onClose }: PopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (target && popoverRef.current) {
            const targetRect = target.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            
            let top = targetRect.top - popoverRect.height - 8; // 8px gap
            let left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);
            
            // Boundary checks
            if (top < 8) top = targetRect.bottom + 8;
            if (left < 8) left = 8;
            if (left + popoverRect.width > window.innerWidth - 8) {
                left = window.innerWidth - popoverRect.width - 8;
            }

            setStyle({
                top: `${top}px`,
                left: `${left}px`,
                position: 'fixed',
            });
        }
    }, [target]);

    const handleCopy = () => {
        if (!phase.rawData) return;
        navigator.clipboard.writeText(JSON.stringify(phase.rawData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={style}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 z-[110] w-60"
        >
            <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-sm text-white">{phase.name}</p>
                 <p className="text-xs text-gray-400 capitalize">{phase.status}</p>
            </div>
            <div className="space-y-1 border-t border-gray-700 pt-2">
                {phase.stats?.timeMs && <StatItem label="Time" value={`${phase.stats.timeMs}ms`} />}
                {phase.stats?.retrieved && <StatItem label="Retrieved" value={phase.stats.retrieved} />}
                {phase.stats?.used && <StatItem label="Used" value={phase.stats.used} />}
                {phase.stats?.tokens && <StatItem label="Tokens" value={phase.stats.tokens} />}
                {phase.stats?.model && <StatItem label="Model" value={phase.stats.model} />}

                {phase.rawData && (
                    <button onClick={handleCopy} className="w-full mt-2 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/80 p-1.5 rounded-md">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Raw Data'}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default CognitivePhasePopover;