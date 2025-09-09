

"use client";

import React from 'react';
import type { Message } from '@/lib/types';

interface MessageFooterProps {
    message: Message;
}

const MessageFooter = ({ message }: MessageFooterProps) => {
    const formattedDate = new Date(message.createdAt).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short',
    });

    return (
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
            <span>{formattedDate}</span>
            {message.tokenCount && message.tokenCount > 0 && <span>{message.tokenCount} tokens</span>}
            {message.responseTime && <span>{message.responseTime} ms</span>}
        </div>
    );
};

export default MessageFooter;
