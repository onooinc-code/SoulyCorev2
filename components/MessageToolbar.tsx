
"use client";

import React from 'react';
import type { Message as MessageType } from '@/lib/types';
import { 
    CopyIcon, BookmarkIcon, BookmarkFilledIcon, SummarizeIcon, EditIcon, 
    TrashIcon, RefreshIcon, BeakerIcon, CodeIcon 
} from '@/components/Icons';

interface MessageToolbarProps {
    message: MessageType;
    isHovering: boolean;
    onCopy: () => void;
    onSummarize: (content: string) => void;
    onToggleBookmark: (messageId: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onUpdateMessage: (messageId: string) => void;
    onRegenerate: (messageId: string) => void;
    onInspect: (messageId: string) => void;
    onViewHtml: (htmlContent: string) => void;
}

const MessageToolbar = ({
    message,
    isHovering,
    onCopy,
    onSummarize,
    onToggleBookmark,
    onDeleteMessage,
    onUpdateMessage,
    onRegenerate,
    onInspect,
    onViewHtml
}: MessageToolbarProps) => {

    const hasHtml = /<html/i.test(message.content);

    return (
        <div className={`absolute -top-4 right-4 flex items-center gap-1 p-1 rounded-full bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 shadow-lg transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={onCopy} title="Copy" className="p-1.5 hover:bg-gray-600 rounded-full"><CopyIcon className="w-4 h-4" /></button>
            <button onClick={() => onToggleBookmark(message.id)} title={message.isBookmarked ? "Remove Bookmark" : "Bookmark"} className="p-1.5 hover:bg-gray-600 rounded-full">
                {message.isBookmarked ? <BookmarkFilledIcon className="w-4 h-4 text-indigo-400" /> : <BookmarkIcon className="w-4 h-4" />}
            </button>
            {message.role === 'model' && (
                <button onClick={() => onSummarize(message.content)} title="Summarize" className="p-1.5 hover:bg-gray-600 rounded-full"><SummarizeIcon className="w-4 h-4" /></button>
            )}
            <button onClick={() => onUpdateMessage(message.id)} title="Edit" className="p-1.5 hover:bg-gray-600 rounded-full"><EditIcon className="w-4 h-4" /></button>
            <button onClick={() => onDeleteMessage(message.id)} title="Delete" className="p-1.5 hover:bg-gray-600 rounded-full"><TrashIcon className="w-4 h-4" /></button>
            <button onClick={() => onRegenerate(message.id)} title="Regenerate" className="p-1.5 hover:bg-gray-600 rounded-full"><RefreshIcon className="w-4 h-4" /></button>
            {hasHtml && (
                <button onClick={() => onViewHtml(message.content)} title="View as HTML" className="p-1.5 hover:bg-gray-600 rounded-full"><CodeIcon className="w-4 h-4" /></button>
            )}
            <button onClick={() => onInspect(message.id)} title="Inspect Cognitive Process" className="p-1.5 hover:bg-gray-600 rounded-full"><BeakerIcon className="w-4 h-4" /></button>
        </div>
    );
};

export default MessageToolbar;
