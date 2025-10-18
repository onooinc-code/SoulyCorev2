
"use client";

import React from 'react';
import { CpuChipIcon, ClockIcon } from '@/components/Icons';
import type { Message as MessageType } from '@/lib/types';

interface MessageFooterProps {
    message: MessageType;
    isContextAssemblyRunning: boolean;
    isMemoryExtractionRunning: boolean;
}

const MessageFooter = ({ message, isContextAssemblyRunning, isMemoryExtractionRunning }: MessageFooterProps) => {
    const showFooter = message.tokenCount || message.responseTime || isContextAssemblyRunning || isMemoryExtractionRunning;

    if (!showFooter) {
        return null;
    }

    return (
        <div className="text-xs text-gray-500 mt-2 flex items-center justify-end gap-3">
            {isContextAssemblyRunning && (
                <div className="flex items-center gap-1 text-yellow-400 animate-pulse">
                    <CpuChipIcon className="w-3 h-3" />
                    <span>Assembling context...</span>
                </div>
            )}
            {isMemoryExtractionRunning && (
                <div className="flex items-center gap-1 text-yellow-400 animate-pulse">
                    <CpuChipIcon className="w-3 h-3" />
                    <span>Extracting memories...</span>
                </div>
            )}
            {message.tokenCount && <span>{message.tokenCount} tokens</span>}
            {message.responseTime && (
                <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{message.responseTime} ms</span>
                </div>
            )}
        </div>
    );
};

export default MessageFooter;
