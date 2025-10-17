"use client";

import React from 'react';
import { useConversation } from './providers/ConversationProvider';
import CognitiveStatusBar from './chat/CognitiveStatusBar';
import { motion, AnimatePresence } from 'framer-motion';
import type { CognitiveStatus } from '@/lib/types';

// This component is now a wrapper that decides which status to show.
// For this request, we'll focus on the new CognitiveStatusBar.
const ChatStatus = () => {
    const { status, messages } = useConversation();
    
    // The "isLoading" state is now implicitly handled by checking the status object
    // FIX: `typeof null` is 'object' in JS. This check now correctly handles null values.
    const isLoading = typeof status.currentAction === 'object' && status.currentAction !== null;
    
    const handleInspect = () => {
        // This is a placeholder as the inspect click is now handled in ChatFooter
        // to have access to the modal state setter.
        console.log("Inspect requested from status bar");
    };

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <CognitiveStatusBar 
                        status={status.currentAction as CognitiveStatus}
                        onInspect={handleInspect} // Note: This is now handled in ChatFooter
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatStatus;