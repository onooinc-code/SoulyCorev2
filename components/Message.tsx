"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Message as MessageType, Conversation } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';

interface MessageProps {
    message: MessageType;
    onSummarize: (content: string) => void;
    onToggleBookmark: (messageId: string) => void;
    onDelete: (messageId: string) => void;
    onUpdate: (messageId: string, newContent: string) => void;
    onRegenerate: (messageId: string) => void;
    onInspect: (messageId: string) => void;
    onViewHtml: (htmlContent: string) => void;
    isContextAssemblyRunning?: boolean;
    isMemoryExtractionRunning?: boolean;
    currentConversation: Conversation | null;
    onSetConversationAlign: (align: 'left' | 'right') => void;
}

const WORD_COUNT_THRESHOLD = 250;

const Message = ({ 
    message, 
    onSummarize, 
    onToggleBookmark, 
    onDelete, 
    onUpdate, 
    onRegenerate, 
    onInspect,
    onViewHtml,
    isContextAssemblyRunning,
    isMemoryExtractionRunning,
    currentConversation,
    onSetConversationAlign
}: MessageProps) => {
    const isUser = message.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    
    const isLongMessage = !isUser && message.content.split(/\s+/).length > WORD_COUNT_THRESHOLD;
    
    // Per-message collapse state is local and ephemeral, stored in component state.
    const [isCollapsed, setIsCollapsed] = useState(isLongMessage);

    const showProgressBar = isContextAssemblyRunning || isMemoryExtractionRunning;
    const progressText = isContextAssemblyRunning ? "Assembling Context..." : "Extracting Memories...";

    const extractedHtml = useMemo(() => {
        const match = message.content.match(/```html\n([\s\S]*?)\n```/);
        return match ? match[1] : null;
    }, [message.content]);


    useEffect(() => {
        if (isLongMessage && isCollapsed && !summary && currentConversation?.enableAutoSummarization) {
            const fetchSummary = async () => {
                try {
                    const cachedSummaries = JSON.parse(localStorage.getItem('messageSummaries') || '{}');
                    if (cachedSummaries[message.id]) {
                        setSummary(cachedSummaries[message.id]);
                        return;
                    }
                } catch (e) { console.error("Failed to parse summary cache", e); }

                setIsSummaryLoading(true);
                try {
                    const res = await fetch('/api/summarize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: message.content }),
                    });
                    if (!res.ok) throw new Error('Failed to fetch summary.');
                    const data = await res.json();
                    
                    if (data.summary) {
                        setSummary(data.summary);
                        try {
                             const cachedSummaries = JSON.parse(localStorage.getItem('messageSummaries') || '{}');
                             cachedSummaries[message.id] = data.summary;
                             localStorage.setItem('messageSummaries', JSON.stringify(cachedSummaries));
                        } catch(e) { console.error("Failed to cache summary", e); }
                    } else {
                        throw new Error("API returned an empty summary.");
                    }
                } catch (error) {
                    console.error("Summary fetch error:", error);
                    setSummary("Failed to generate summary.");
                } finally {
                    setIsSummaryLoading(false);
                }
            };
            fetchSummary();
        }
    }, [isLongMessage, isCollapsed, message.id, message.content, summary, currentConversation]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
    };

    const handleSaveEdit = () => {
        if (editedContent.trim() !== message.content) {
            onUpdate(message.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content);
        setIsEditing(false);
    };

    const renderMessageContent = () => {
        if (isEditing) {
            return (
                <div className="not-prose">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-2 bg-gray-800/50 rounded-md text-white resize-y border border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        rows={Math.max(3, editedContent.split('\n').length)}
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-green-600 rounded hover:bg-green-500">Save</button>
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    </div>
                </div>
            );
        }

        if (isLongMessage && isCollapsed) {
            if (!currentConversation?.enableAutoSummarization) {
                 return <p className="italic text-gray-400">Message content collapsed. Auto-summary is disabled for this conversation.</p>;
            }
            if (isSummaryLoading) {
                return <p className="italic text-gray-400">Generating summary...</p>;
            }
            if (summary) {
                return <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>;
            }
            return <p className="italic text-gray-400">Message content collapsed...</p>;
        }
        
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>;
    };

    const renderToggleCollapseButton = () => {
        if (!isLongMessage || isEditing) return null;

        const buttonText = isCollapsed ? 'Show More' : 'Show Less';
        
        return (
            <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="px-3 py-1 text-xs bg-gray-600/50 text-gray-300 rounded-full hover:bg-gray-600"
                >
                    {buttonText}
                </button>
            </div>
        );
    };

    const textAlignClass = currentConversation?.ui_settings?.textAlign === 'right' ? 'text-right' : 'text-left';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`group flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                    AI
                </div>
            )}
            <div className={`w-full`}>
                 <div className={`flex items-center text-xs text-gray-400 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <MessageToolbar 
                        isBookmarked={message.isBookmarked || false}
                        isCollapsed={isCollapsed}
                        isUser={isUser}
                        onCopy={handleCopy}
                        onBookmark={() => onToggleBookmark(message.id)}
                        onSummarize={() => onSummarize(message.content)}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                        onSetAlign={onSetConversationAlign}
                        onDelete={() => onDelete(message.id)}
                        onEdit={() => setIsEditing(true)}
                        onRegenerate={() => onRegenerate(message.id)}
                        onInspect={() => onInspect(message.id)}
                        onViewHtml={extractedHtml ? () => onViewHtml(extractedHtml) : undefined}
                    />
                </div>
                <div className={`prose-custom max-w-none p-4 rounded-lg ${textAlignClass} ${isUser ? 'bg-blue-600/30 backdrop-blur-md border border-blue-400/30 text-white rounded-br-none' : 'bg-gray-700/30 backdrop-blur-md border border-gray-500/30 text-gray-200 rounded-bl-none'}`}>
                    {renderMessageContent()}
                </div>
                 {renderToggleCollapseButton()}
                 <div className={`flex items-center mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <MessageFooter message={message} />
                 </div>
                 {showProgressBar && (
                    <div className={`mt-2 flex items-center gap-2 text-xs text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                         <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-indigo-500"
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                        <span>{progressText}</span>
                    </div>
                )}
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                    You
                </div>
            )}
        </motion.div>
    );
};

export default Message;