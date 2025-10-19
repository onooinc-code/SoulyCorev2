"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Message as MessageType, Conversation } from '@/lib/types';
// FIX: Corrected a relative import path for icon components to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { UserCircleIcon, CpuChipIcon } from '@/components/Icons';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';
import { useSettings } from './providers/SettingsProvider';

// A custom renderer for code blocks
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
        <div className="bg-gray-900 rounded-md my-2">
            <div className="flex items-center justify-between px-4 py-1 bg-gray-700 rounded-t-md text-xs text-gray-300">
                <span>{match ? match[1] : ''}</span>
            </div>
            <pre className="p-4 overflow-x-auto">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

const extractHtmlContent = (markdown: string): { html: string | null; markdown: string } => {
    const htmlRegex = /```html\n([\s\S]*?)\n```/;
    const match = markdown.match(htmlRegex);
    if (match) {
        return {
            html: match[1],
            markdown: markdown.replace(htmlRegex, '').trim(),
        };
    }
    return { html: null, markdown };
};

interface MessageProps {
    message: MessageType;
    onSummarize: (content: string) => void;
    onToggleBookmark: (messageId: string) => void;
    onDelete: () => void;
    onUpdateMessage: (messageId: string, newContent: string) => void;
    onRegenerate: () => void;
    onInspect: () => void;
    isContextAssemblyRunning: boolean;
    isMemoryExtractionRunning: boolean;
    onViewHtml: (htmlContent: string) => void;
    currentConversation: Conversation | null;
    onSetConversationAlign: (align: 'left' | 'right') => void;
    onReply: (message: MessageType) => void;
    findMessageById: (id: string) => MessageType | undefined;
}

const Message = ({
    message,
    onSummarize,
    onToggleBookmark,
    onDelete,
    onUpdateMessage,
    onRegenerate,
    onInspect,
    isContextAssemblyRunning,
    isMemoryExtractionRunning,
    onViewHtml,
    currentConversation,
    onSetConversationAlign,
    onReply,
    findMessageById,
}: MessageProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { settings } = useSettings();
    
    const { html, markdown } = extractHtmlContent(message.content);

    const handleSave = () => {
        if (editedContent.trim() !== message.content) {
            onUpdateMessage(message.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [isEditing]);
    
    // Auto-collapse long messages if enabled
    useEffect(() => {
        if (currentConversation?.enableAutoSummarization && message.content.length > 1000 && !isCollapsed) {
            setIsCollapsed(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentConversation?.enableAutoSummarization, message.id]);

    const isUser = message.role === 'user';
    const parentMessage = message.parentMessageId ? findMessageById(message.parentMessageId) : null;
    
    const bubbleStyles = isUser
        ? "bg-indigo-600/50 border-indigo-500/30 rounded-t-2xl rounded-bl-2xl rounded-br-sm"
        : "bg-gradient-to-br from-gray-700/70 to-gray-800/60 border-gray-500/30 rounded-t-2xl rounded-br-2xl rounded-bl-sm";
    
    const textAlignClass = currentConversation?.ui_settings?.textAlign === 'right' ? 'text-right' : 'text-left';
    
    const messageFontSizeClasses: { [key: string]: string } = {
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    };
    
    const messageFontSizeKey = settings?.global_ui_settings?.messageFontSize || 'sm';
    const messageFontSize = messageFontSizeClasses[messageFontSizeKey] || 'text-sm';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`group flex items-start gap-4 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            data-message-id={message.id}
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mt-1">
                {isUser ? <UserCircleIcon className="w-6 h-6 text-gray-400" /> : <CpuChipIcon className="w-6 h-6 text-indigo-400" />}
            </div>
            <div className={`flex flex-col flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative p-4 w-full max-w-4xl shadow-lg backdrop-blur-lg border ${bubbleStyles}`}>
                    {parentMessage && (
                        <div className="text-xs text-gray-400 mb-2 border-l-2 border-gray-500 pl-2">
                            Replying to <strong>{parentMessage.role === 'user' ? 'you' : 'the model'}</strong>: <em>"{parentMessage.content.substring(0, 50)}..."</em>
                        </div>
                    )}
                    <AnimatePresence>
                        {isEditing ? (
                            <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <textarea
                                    ref={textareaRef}
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
                                    className="w-full bg-gray-600 text-white rounded-md p-2 text-sm resize-none overflow-hidden"
                                />
                            </motion.div>
                        ) : (
                             <motion.div key="displaying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`prose-custom w-full max-w-none ${textAlignClass} ${messageFontSize}`}>
                                {isCollapsed ? (
                                    <p className="italic text-gray-400">[Message content is long and has been collapsed. Click expand in the toolbar to view.]</p>
                                ) : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{ code: CodeBlock }}
                                    >
                                        {markdown}
                                    </ReactMarkdown>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                 <div className={`mt-1 flex h-8 items-center opacity-0 transition-opacity group-hover:opacity-100 ${isEditing ? '!opacity-0' : ''}`}>
                    <MessageToolbar
                        isUser={isUser}
                        isBookmarked={message.isBookmarked || false}
                        isCollapsed={isCollapsed}
                        onCopy={() => navigator.clipboard.writeText(message.content)}
                        onBookmark={() => onToggleBookmark(message.id)}
                        onSummarize={() => onSummarize(message.content)}
                        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
                        onSetAlign={onSetConversationAlign}
                        onEdit={() => setIsEditing(true)}
                        onDelete={onDelete}
                        onRegenerate={onRegenerate}
                        onInspect={onInspect}
                        onViewHtml={html ? () => onViewHtml(html) : undefined}
                        onReply={() => onReply(message)}
                    />
                </div>

                 <AnimatePresence>
                    {isContextAssemblyRunning && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-yellow-400 mt-1 flex items-center gap-1.5 animate-pulse">
                            <CpuChipIcon className="w-3 h-3"/> Assembling Context...
                        </motion.div>
                    )}
                     {isMemoryExtractionRunning && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-purple-400 mt-1 flex items-center gap-1.5 animate-pulse">
                            <CpuChipIcon className="w-3 h-3"/> Learning from conversation...
                        </motion.div>
                    )}
                </AnimatePresence>
                <MessageFooter message={message} />
                
                {message.threadMessages && message.threadMessages.length > 0 && (
                     <div className="mt-4 pl-8 border-l-2 border-gray-700 space-y-4">
                        {message.threadMessages.map(reply => (
                            <div key={reply.id}>
                               <Message 
                                    message={reply}
                                    onSummarize={onSummarize}
                                    onToggleBookmark={onToggleBookmark}
                                    onDelete={() => onDelete()}
                                    onUpdateMessage={onUpdateMessage}
                                    onRegenerate={() => onRegenerate()}
                                    onInspect={() => onInspect()}
                                    isContextAssemblyRunning={false}
                                    isMemoryExtractionRunning={false}
                                    onViewHtml={onViewHtml}
                                    currentConversation={currentConversation}
                                    onSetConversationAlign={onSetConversationAlign}
                                    onReply={onReply}
                                    findMessageById={findMessageById}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Message;