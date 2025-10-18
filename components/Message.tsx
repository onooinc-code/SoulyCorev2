
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import type { Conversation, Message as MessageType } from '@/lib/types';
import { useSettings } from './providers/SettingsProvider';
import { useLog } from './providers/LogProvider';
import { UserCircleIcon, CpuChipIcon, CopyIcon, CheckIcon, SparklesIcon } from './Icons';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';

const CodeBlock = ({ language, value }: { language: string | undefined, value: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative text-sm">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 bg-gray-600 rounded-md text-gray-300 hover:bg-gray-500 transition-colors"
            >
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            <SyntaxHighlighter language={language} style={oneDark} PreTag="div">
                {String(value).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

// A more robust implementation of the custom 'code' component to definitively fix a
// persistent TypeScript type inference issue in the build environment.
const markdownComponents: Components = {
    code: (props) => {
        // Destructure known props but explicitly avoid 'inline' due to the type issue.
        // 'node' is also destructured to prevent it from being passed to the native <code> tag.
        const { className, children, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');

        // Access 'inline' via a type assertion as a workaround for the inference problem.
        const isInline = (props as any).inline;

        return !isInline && match ? (
            <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
        ) : (
            // Pass only valid HTML attributes to the native <code> tag.
            <code className={className} {...rest}>
                {children}
            </code>
        );
    }
};

interface MessageProps {
    message: MessageType;
    onSummarize: (content: string) => void;
    onToggleBookmark: (messageId: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onUpdateMessage: (messageId: string, newContent: string) => void;
    onRegenerate: (messageId: string) => void;
    onInspect: (messageId: string) => void;
    isContextAssemblyRunning: boolean;
    isMemoryExtractionRunning: boolean;
    onViewHtml: (htmlContent: string) => void;
    currentConversation: Conversation | null;
    onSetConversationAlign: (align: 'left' | 'right') => void;
    onReply: (message: MessageType) => void;
    findMessageById: (id: string) => MessageType | undefined;
}

const Message = (props: MessageProps) => {
    const {
        message, onSummarize, onToggleBookmark, onDeleteMessage, onUpdateMessage,
        onRegenerate, onInspect, isContextAssemblyRunning, isMemoryExtractionRunning,
        onViewHtml, currentConversation, onSetConversationAlign, onReply, findMessageById
    } = props;
    
    const { settings } = useSettings();
    const { log } = useLog();

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isHovered, setIsHovered] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHtml, setIsHtml] = useState(false);

    const isUser = message.role === 'user';
    const textAlign = currentConversation?.ui_settings?.textAlign || 'left';

    useEffect(() => {
        const isLong = message.content.split('\n').length > 20 || message.content.length > 2000;
        if (settings?.featureFlags?.enableAutoSummarization && isLong && message.role === 'model') {
            setIsCollapsed(true);
        }
    }, [message, settings]);

    useEffect(() => {
        const htmlRegex = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/is;
        setIsHtml(htmlRegex.test(message.content));
    }, [message.content]);

    const handleSaveEdit = () => {
        if (editedContent.trim() !== message.content) {
            onUpdateMessage(message.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content);
        setIsEditing(false);
    };

    const parentMessage = useMemo(() => {
        if (!message.parentMessageId) return null;
        return findMessageById(message.parentMessageId);
    }, [message.parentMessageId, findMessageById]);

    const messageFontSizeClass = useMemo(() => {
        const sizeMap = {
            sm: 'text-sm',
            base: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
        };
        return sizeMap[settings?.global_ui_settings?.messageFontSize || 'sm'];
    }, [settings]);

    const alignmentClass = textAlign === 'right' ? 'items-end' : 'items-start';
    const bubbleClass = isUser
        ? 'bg-gray-700/50 text-gray-200'
        : 'bg-gray-800/60 text-gray-200';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-2 group ${alignmentClass}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 mt-1">
                    {isUser ? <UserCircleIcon className="w-6 h-6 text-gray-400" /> : <CpuChipIcon className="w-6 h-6 text-indigo-400" />}
                </div>

                <div className={`relative w-full max-w-4xl`}>
                    <AnimatePresence>
                        {isHovered && !isEditing && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`absolute z-10 ${isUser ? 'left-0 -top-4' : 'right-0 -top-4'}`}
                            >
                                <MessageToolbar
                                    isBookmarked={!!message.isBookmarked}
                                    isCollapsed={isCollapsed}
                                    isUser={isUser}
                                    onCopy={() => navigator.clipboard.writeText(message.content)}
                                    onBookmark={() => onToggleBookmark(message.id)}
                                    onSummarize={() => onSummarize(message.content)}
                                    onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                                    onSetAlign={onSetConversationAlign}
                                    onEdit={() => setIsEditing(true)}
                                    onDelete={() => onDeleteMessage(message.id)}
                                    onRegenerate={() => onRegenerate(message.id)}
                                    onInspect={() => onInspect(message.id)}
                                    onViewHtml={isHtml ? () => onViewHtml(message.content) : undefined}
                                    onReply={() => onReply(message)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {parentMessage && (
                        <div className="text-xs text-gray-500 mb-1 p-2 border-l-2 border-gray-600">
                            Replying to {parentMessage.role === 'user' ? 'you' : 'the model'}: <em>"{parentMessage.content.substring(0, 50)}..."</em>
                        </div>
                    )}
                    
                    <div className={`p-4 rounded-lg ${bubbleClass} ${messageFontSizeClass}`}>
                        {isEditing ? (
                            <div>
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full bg-gray-800 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={Math.max(3, editedContent.split('\n').length)}
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                    <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                                    <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-indigo-600 rounded-md hover:bg-indigo-500">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose-custom max-w-none">
                                {isCollapsed ? (
                                    <div className="text-sm italic text-gray-400">
                                        <p>Message content is collapsed. ({message.content.length} characters)</p>
                                        <button onClick={() => setIsCollapsed(false)} className="text-indigo-400 hover:underline">Expand</button>
                                    </div>
                                ) : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={markdownComponents}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <MessageFooter message={message} />

                    {isContextAssemblyRunning && (
                        <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1 animate-pulse"><SparklesIcon className="w-3 h-3"/><span>Assembling context...</span></div>
                    )}
                    {isMemoryExtractionRunning && (
                        <div className="mt-2 text-xs text-purple-400 flex items-center gap-1 animate-pulse"><SparklesIcon className="w-3 h-3"/><span>Learning...</span></div>
                    )}
                </div>
            </div>

            {message.threadMessages && message.threadMessages.length > 0 && (
                <div className={`pl-12 space-y-4 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {message.threadMessages.map(reply => (
                        // FIX: Wrapped the iterated Message component in a div with a key. The 'key' prop is a React-specific attribute for list reconciliation and should not be passed as a prop to the component itself. This resolves the TypeScript error.
                        <div key={reply.id}>
                            <Message
                                message={reply}
                                {...props}
                                isContextAssemblyRunning={false}
                                isMemoryExtractionRunning={false}
                            />
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Message;
