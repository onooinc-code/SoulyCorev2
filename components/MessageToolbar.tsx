

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CopyIcon, BookmarkIcon, BookmarkFilledIcon, SummarizeIcon, CollapseIcon, ExpandIcon, CheckIcon, EditIcon, TrashIcon, RefreshIcon, TextAlignLeftIcon, TextAlignRightIcon, DotsHorizontalIcon, BeakerIcon, EyeIcon } from './Icons';
import { useLog } from './providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';

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
}

const MessageToolbar = ({
    isBookmarked, isCollapsed, isUser, onCopy, onBookmark, onSummarize, onToggleCollapse, onSetAlign, onEdit, onDelete, onRegenerate, onInspect, onViewHtml
}: MessageToolbarProps) => {
    const [copied, setCopied] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { log } = useLog();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = () => {
        log('User clicked "Copy message" button.');
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const mainActions = [
        { id: 'copy', icon: copied ? CheckIcon : CopyIcon, action: handleCopy, title: 'Copy message content', className: copied ? 'text-green-400' : 'hover:text-white' },
        { id: 'bookmark', icon: isBookmarked ? BookmarkFilledIcon : BookmarkIcon, action: onBookmark, title: 'Bookmark this message', className: isBookmarked ? 'text-yellow-400' : 'hover:text-yellow-400' },
        { id: 'regenerate', icon: RefreshIcon, action: onRegenerate, title: isUser ? 'Rewrite prompt and get new response' : 'Get a new response', className: 'hover:text-white' },
    ];
    
    if (onViewHtml) {
        mainActions.push({ id: 'viewHtml', icon: EyeIcon, action: onViewHtml, title: 'Render HTML content', className: 'hover:text-white' });
    }

    const menuActions = [
        { id: 'summarize', icon: SummarizeIcon, action: onSummarize, title: 'Summarize message' },
        { id: 'inspect', icon: BeakerIcon, action: onInspect, title: 'Inspect cognitive process' },
        { id: 'collapse', icon: isCollapsed ? ExpandIcon : CollapseIcon, action: onToggleCollapse, title: isCollapsed ? 'Expand message' : 'Collapse message' },
        { id: 'align-left', icon: TextAlignLeftIcon, action: () => onSetAlign('left'), title: 'Align text left' },
        { id: 'align-right', icon: TextAlignRightIcon, action: () => onSetAlign('right'), title: 'Align text right' },
        ...(isUser ? [{ id: 'edit', icon: EditIcon, action: onEdit, title: 'Edit your message' }] : []),
        { id: 'delete', icon: TrashIcon, action: onDelete, title: 'Delete message', className: 'hover:text-red-400' },
    ];

    return (
        <div className="relative flex items-center gap-1 text-gray-400 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {mainActions.map(action => (
                <button key={action.id} onClick={action.action} className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${action.className}`} title={action.title}>
                    <action.icon className="w-4 h-4" />
                </button>
            ))}
            
            <div className="w-px h-4 bg-white/10 mx-1"></div>

            <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors" title="More actions">
                    <DotsHorizontalIcon className="w-4 h-4" />
                </button>
                <AnimatePresence>
                    {isMenuOpen && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-1 z-10"
                        >
                            {menuActions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => { action.action(); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-gray-200 rounded-md hover:bg-indigo-600 disabled:opacity-50 ${action.className || ''}`}
                                >
                                    <action.icon className="w-4 h-4" />
                                    <span>{action.title}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MessageToolbar;
