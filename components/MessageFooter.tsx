
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
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap">
            <span>{formattedDate}</span>
            {message.tokenCount && message.tokenCount > 0 && <span>{message.tokenCount} tokens</span>}
            {message.responseTime && <span>{message.responseTime} ms</span>}
            {message.tags && message.tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                    {message.tags.map(tag => (
                        <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MessageFooter;