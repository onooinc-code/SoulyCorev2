
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
    CopyIcon, BookmarkIcon, BookmarkFilledIcon, SummarizeIcon, CollapseIcon, ExpandIcon, 
    CheckIcon, EditIcon, TrashIcon, RefreshIcon, TextAlignLeftIcon, TextAlignRightIcon, 
    DotsHorizontalIcon, BeakerIcon, EyeIcon, ChatBubbleLeftRightIcon, CommandLineIcon, WrenchScrewdriverIcon
} from './Icons';
import { useLog } from './providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';

// A helper type for menu items
type MenuItem = {
    id: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    action: (e?: React.MouseEvent) => void;
    title: string;
    className?: string;
    isUserOnly?: boolean;
    isModelOnly?: boolean;
    isHtml?: boolean;
};

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
}

const MessageToolbar = (props: MessageToolbarProps) => {
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

    const handleCopy = useCallback(() => {
        log('User clicked "Copy message" button.');
        props.onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [log, props.onCopy]);

    const allActions = useMemo<(MenuItem | 'separator')[]>(() => {
        const { onReply, isBookmarked, onBookmark, onSummarize, onRegenerate, isUser, onEdit, onDelete, onViewHtml, onInspect, isCollapsed, onToggleCollapse, onSetAlign } = props;
        
        return [
            { id: 'reply', icon: ChatBubbleLeftRightIcon, action: onReply, title: 'Reply to this message' },
            { id: 'copy', icon: copied ? CheckIcon : CopyIcon, action: handleCopy, title: 'Copy message content', className: copied ? 'text-green-400' : 'hover:text-white' },
            { id: 'bookmark', icon: isBookmarked ? BookmarkFilledIcon : BookmarkIcon, action: onBookmark, title: 'Bookmark this message', className: isBookmarked ? 'text-yellow-400' : 'hover:text-yellow-400' },
            { id: 'summarize', icon: SummarizeIcon, action: onSummarize, title: 'Summarize message' },
            { id: 'regenerate', icon: RefreshIcon, action: onRegenerate, title: isUser ? 'Rewrite prompt and get new response' : 'Get a new response' },
            { id: 'edit', icon: EditIcon, action: onEdit, title: 'Edit your message', className: 'hover:text-blue-400', isUserOnly: true },
            { id: 'delete', icon: TrashIcon, action: onDelete, title: 'Delete message', className: 'hover:text-red-400' },
            'separator',
            { id: 'viewHtml', icon: EyeIcon, action: onViewHtml, title: 'Render HTML content', isHtml: true, isModelOnly: true },
            { id: 'inspect', icon: BeakerIcon, action: onInspect, title: 'Inspect Cognitive Process (Context)' },
            { id: 'inspect_prompt', icon: CommandLineIcon, action: onInspect, title: 'View Full Prompt Sent to AI', isUserOnly: true },
            { id: 'inspect_config', icon: WrenchScrewdriverIcon, action: onInspect, title: 'View Model Configuration', isUserOnly: true },
            'separator',
            { id: 'collapse', icon: isCollapsed ? ExpandIcon : CollapseIcon, action: onToggleCollapse, title: isCollapsed ? 'Expand message' : 'Collapse message' },
            { id: 'align-left', icon: TextAlignLeftIcon, action: () => onSetAlign('left'), title: 'Align text left' },
            { id: 'align-right', icon: TextAlignRightIcon, action: () => onSetAlign('right'), title: 'Align text right' },
        ].filter(action => {
            if (typeof action === 'string') return true;
            if (action.isUserOnly && !isUser) return false;
            if (action.isModelOnly && isUser) return false;
            if (action.id === 'inspect' && isUser) return false; // Hide generic inspect for user messages
            if (action.id !== 'inspect' && !isUser) {
                 // Only show reply, copy, bookmark, summarize, delete, collapse for model messages
                const allowedForModel = ['reply', 'copy', 'bookmark', 'summarize', 'delete', 'collapse', 'align-left', 'align-right', 'viewHtml', 'regenerate'];
                if (!allowedForModel.includes(action.id)) return false;
            }
            if (action.isHtml && !onViewHtml) return false;
            return true;
        }) as (MenuItem | 'separator')[];
    }, [props, copied, handleCopy]);

    const primaryMobileActionIds = ['reply', 'copy', 'bookmark'];
    const primaryMobileActions = allActions.filter(a => typeof a !== 'string' && primaryMobileActionIds.includes(a.id)) as MenuItem[];
    const secondaryMobileActions = allActions.filter(a => typeof a === 'string' || (typeof a !== 'string' && !primaryMobileActionIds.includes(a.id)));

    return (
        <div className="flex items-center">
            {/* Large screen view */}
            <div className="hidden md:flex items-center gap-1 text-gray-400 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5">
                {allActions.map((action, index) => {
                    if (action === 'separator') {
                        // Avoid rendering separator if it's at the beginning or end
                        if(index === 0 || index === allActions.length - 1) return null;
                        // Avoid rendering separator if the next one is also a separator
                        if(allActions[index+1] === 'separator') return null;
                        return <div key={`sep-${index}`} className="w-px h-4 bg-white/10 mx-1"></div>;
                    }
                    const { id, icon: Icon, action: onClick, title, className } = action as MenuItem;
                    return (
                        <button key={id} onClick={onClick} className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${className || 'hover:text-white'}`} title={title}>
                            <Icon className="w-4 h-4" />
                        </button>
                    );
                })}
            </div>

            {/* Small screen view */}
            <div className="flex md:hidden items-center gap-1 text-gray-400 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5">
                {primaryMobileActions.map(action => {
                     const { id, icon: Icon, action: onClick, title, className } = action as MenuItem;
                     return (
                         <button key={id} onClick={onClick} className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${className || 'hover:text-white'}`} title={title}>
                             <Icon className="w-4 h-4" />
                         </button>
                     );
                })}
                {secondaryMobileActions.length > 0 && (
                     <div className="relative">
                        <div className="w-px h-4 bg-white/10 mx-1"></div>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors" title="More actions">
                            <DotsHorizontalIcon className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute bottom-full right-0 mb-2 w-52 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-1 z-10"
                                >
                                   {secondaryMobileActions.map((action, index) => {
                                       if (action === 'separator') {
                                            if (index > 0 && index < secondaryMobileActions.length - 1) {
                                                if (secondaryMobileActions[index - 1] === 'separator' || secondaryMobileActions[index + 1] === 'separator') return null;
                                                return <div key={`mob-sep-${index}`} className="h-px bg-gray-700 my-1" />;
                                            }
                                            return null;
                                       }
                                       const { id, icon: Icon, action: onClick, title, className } = action as MenuItem;
                                       return (
                                            <button
                                                key={id}
                                                onClick={(e) => { onClick(e); setIsMenuOpen(false); }}
                                                className={`w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-gray-200 rounded-md hover:bg-indigo-600 disabled:opacity-50 ${className || ''}`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span>{title}</span>
                                            </button>
                                       );
                                   })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageToolbar;
