
"use client";

import React from 'react';
import { useConversation } from './providers/ConversationProvider';

// FIX: Removed React.FC to allow for proper type inference with framer-motion props.
const LoadingIndicator = () => {
    const { status } = useConversation();

    return (
        <div className="flex items-center justify-center space-x-2 p-2 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm text-gray-400">{status.currentAction || 'Thinking...'}</span>
        </div>
    );
};

export default LoadingIndicator;
