
"use client";

import React from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import CognitiveStatusBar from './chat/CognitiveStatusBar';
import { motion, AnimatePresence } from 'framer-motion';
import { CognitiveStatus } from '@/lib/types';

const MotionDiv = motion.div as any;

// This component is now a wrapper that decides which status to show.
// For this request, we'll focus on the new CognitiveStatusBar.
const LoadingIndicator = () => {
    const { status } = useConversation();
    
    const handleInspect = () => {
        // This is a placeholder as the inspect click is now handled in ChatFooter
        // to have access to the modal state setter.
        console.log("Inspect requested from status bar");
    };

    // Type guard to ensure status.currentAction is a CognitiveStatus object
    const isCognitiveStatus = (action: any): action is CognitiveStatus => {
        return typeof action === 'object' && action !== null && 'phase' in action && typeof action.details === 'string';
    };


    return (
        <AnimatePresence>
            {isCognitiveStatus(status.currentAction) && (
                <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <CognitiveStatusBar 
                        status={status.currentAction}
                        onInspect={handleInspect}
                    />
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};

export default LoadingIndicator;
