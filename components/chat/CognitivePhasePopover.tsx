"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CognitivePhase {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

interface PopoverProps {
    phase: CognitivePhase;
    target: HTMLElement;
    onClose: () => void;
}

const CognitivePhasePopover = ({ phase, target, onClose }: PopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (target && popoverRef.current) {
            const targetRect = target.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            
            const top = targetRect.top - popoverRect.height - 8; // 8px gap
            const left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);

            setStyle({
                top: `${top}px`,
                left: `${left}px`,
                position: 'fixed',
            });
        }
    }, [target]);

    return (
        <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={style}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-3 z-50"
        >
            <p className="font-semibold text-sm text-white">{phase.name}</p>
            <p className="text-xs text-gray-400">Status: <span className="capitalize">{phase.status}</span></p>
        </motion.div>
    );
};

export default CognitivePhasePopover;
