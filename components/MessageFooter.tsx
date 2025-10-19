"use client";

import React from 'react';
// FIX: Corrected import path for type.
import type { Message } from '@/lib/types';
import { ClockIcon, CpuChipIcon, BookmarkIcon, ArrowsRightLeftIcon } from './Icons';

interface MessageFooterProps {
    message: Message;
    isContextAssemblyRunning: boolean;
    isMemoryExtractionRunning: boolean;
    findMessageById: (id: string) => Message | undefined;
}

const MessageFooter = ({ message, isContextAssemblyRunning, isMemoryExtractionRunning, findMessageById }: MessageFooterProps) => {
    const parentMessage = message.parentMessageId ? findMessageById(message.parentMessageId) : null;
    
    return (
        <div className="text-xs text-gray-500 mt-1.5 flex items-center justify-between h-5">
            <div className="flex items-center gap-3">
                {message.responseTime && (
                    <div className="flex items-center gap-1" title="AI response time">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{message.responseTime}ms</span>
                    </div>
                )}
                {message.tokenCount && (
                     <div className="flex items-center gap-1" title="Token count for this message">
                        <CpuChipIcon className="w-3.5 h-3.5" />
                        <span>{message.tokenCount}</span>
                    </div>
                )}
                {message.isBookmarked && (
                    <div className="flex items-center gap-1 text-yellow-500" title="This message is bookmarked">
                        <BookmarkIcon className="w-3.5 h-3.5" />
                    </div>
                )}
                {parentMessage && (
                    <div className="flex items-center gap-1" title={`In reply to: "${parentMessage.content.substring(0,30)}..."`}>
                        <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {isContextAssemblyRunning && (
                    <span className="text-indigo-400 animate-pulse">Thinking...</span>
                )}
                {isMemoryExtractionRunning && (
                    <span className="text-yellow-400 animate-pulse">Learning...</span>
                )}
            </div>
        </div>
    );
};

export default MessageFooter;