"use client";

import React from 'react';
import {
    BookmarkIcon,
    BookmarkFilledIcon,
    SummarizeIcon,
    CopyIcon,
    CollapseIcon,
    ExpandIcon,
    TextAlignLeftIcon,
    TextAlignRightIcon,
    EditIcon,
    TrashIcon,
    RefreshIcon,
    BeakerIcon,
    CodeIcon,
    ArrowsRightLeftIcon,
    BrainIcon,
    WrenchScrewdriverIcon,
    CommandLineIcon
} from './Icons';

interface MessageToolbarProps {
    isBookmarked: boolean;
    isCollapsed: boolean;
    isUser: boolean;
    onCopy: () => void;
    onBookmark: () => void;
    onSummarize: () => void;
    onToggleCollapse: () => void;
    onSetAlign: (align: 'left' | 'right') => void;
    onEdit: () => void;
    onDelete: () => void;
    onRegenerate: () => void;
    onInspect: () => void;
    onViewHtml?: () => void;
    onReply: () => void;
    onViewContext: (type: 'prompt' | 'system' | 'config') => void;
}

// FIX: Made children optional to resolve type errors on self-closing button usages.
interface ToolbarButtonProps {
    onClick?: () => void;
    title: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

const ToolbarButton = ({ onClick, title, children, disabled }: ToolbarButtonProps) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className="p-2 rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);


const MessageToolbar = (props: MessageToolbarProps) => {
    const {
        isBookmarked, isCollapsed, isUser, onCopy, onBookmark, onSummarize, onToggleCollapse,
        onSetAlign, onEdit, onDelete, onRegenerate, onInspect, onViewHtml, onReply, onViewContext
    } = props;

    return (
        <div className="flex items-center gap-1 bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-full px-2 py-1">
            <ToolbarButton onClick={onBookmark} title={isBookmarked ? "Remove bookmark" : "Bookmark message"}>
                {isBookmarked ? <BookmarkFilledIcon className="w-4 h-4 text-yellow-400" /> : <BookmarkIcon className="w-4 h-4" />}
            </ToolbarButton>
            <ToolbarButton onClick={onCopy} title="Copy content">
                <CopyIcon className="w-4 h-4" />
            </ToolbarButton>
             <ToolbarButton onClick={onReply} title="Reply to message">
                <ArrowsRightLeftIcon className="w-4 h-4" />
            </ToolbarButton>
            {!isUser && (
                <ToolbarButton onClick={onSummarize} title="Summarize message">
                    <SummarizeIcon className="w-4 h-4" />
                </ToolbarButton>
            )}

            <div className="w-px h-4 bg-gray-600 mx-1" />

            <ToolbarButton onClick={onToggleCollapse} title={isCollapsed ? "Expand message" : "Collapse message"}>
                {isCollapsed ? <ExpandIcon className="w-4 h-4" /> : <CollapseIcon className="w-4 h-4" />}
            </ToolbarButton>
            <ToolbarButton onClick={() => onSetAlign('left')} title="Align conversation left">
                <TextAlignLeftIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => onSetAlign('right')} title="Align conversation right">
                <TextAlignRightIcon className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-4 bg-gray-600 mx-1" />

            <ToolbarButton onClick={onEdit} title="Edit message">
                <EditIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onRegenerate} title={isUser ? "Rewrite prompt and resend" : "Regenerate AI response"}>
                <RefreshIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onDelete} title="Delete message">
                <TrashIcon className="w-4 h-4" />
            </ToolbarButton>

             <div className="w-px h-4 bg-gray-600 mx-1" />
            
            {!isUser && (
                 <ToolbarButton onClick={onInspect} title="Inspect cognitive process">
                    <BeakerIcon className="w-4 h-4" />
                </ToolbarButton>
            )}
             {!isUser && (
                 <div className="flex items-center">
                    <ToolbarButton onClick={() => onViewContext('prompt')} title="View Final Prompt"><CommandLineIcon className="w-4 h-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => onViewContext('system')} title="View System Instructions"><BrainIcon className="w-4 h-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => onViewContext('config')} title="View Model Config"><WrenchScrewdriverIcon className="w-4 h-4" /></ToolbarButton>
                 </div>
            )}


            {onViewHtml && (
                <ToolbarButton onClick={onViewHtml} title="View as HTML">
                    <CodeIcon className="w-4 h-4" />
                </ToolbarButton>
            )}

        </div>
    );
};

export default MessageToolbar;
