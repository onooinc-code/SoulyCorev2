
"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import type { Message as MessageType, Conversation } from '@/lib/types';
import { UserCircleIcon, CpuChipIcon } from '@/components/Icons';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';
import { useSettings } from './providers/SettingsProvider';

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

// A simple regex to detect Arabic characters
const arabicRegex = /[\u0600-\u06FF]/;

const Message = ({ message, ...props }: MessageProps) => {
    const { settings } = useSettings();
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isUser = message.role === 'user';
    const align = props.currentConversation?.ui_settings?.textAlign || 'left';
    const messageFontSizeClass = {
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    }[settings?.global_ui_settings?.messageFontSize || 'sm'];
    
    const containsArabic = arabicRegex.test(message.content);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [isEditing]);
    
    const handleUpdate = () => {
        if (editedContent.trim() !== message.content) {
            props.onUpdateMessage(message.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const renderParentMessage = () => {
        if (!message.parentMessageId) return null;
        const parentMessage = props.findMessageById(message.parentMessageId);
        if (!parentMessage) return null;

        return (
            <div className="text-xs text-gray-400 border-l-2 border-gray-600 pl-2 mb-2 opacity-70">
                Replying to: <em>"{parentMessage.content.substring(0, 50)}..."</em>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 group relative ${align === 'right' ? 'justify-end' : ''}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {!isUser && align === 'left' && <div className="p-2 bg-gray-700 rounded-full"><CpuChipIcon className="w-5 h-5 text-indigo-400" /></div>}
            
            <div className={`flex-1 min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
                <div className={`relative px-4 py-3 rounded-2xl w-full ${isUser ? 'bg-indigo-600/50' : 'bg-gray-700/60'}`}>
                    <MessageToolbar 
                        message={message} 
                        isHovering={isHovering}
                        onCopy={handleCopy}
                        onSummarize={() => props.onSummarize(message.content)}
                        onToggleBookmark={props.onToggleBookmark}
                        onDeleteMessage={props.onDeleteMessage}
                        onUpdateMessage={() => setIsEditing(true)}
                        onRegenerate={props.onRegenerate}
                        onInspect={props.onInspect}
                        onViewHtml={props.onViewHtml}
                    />
                    {renderParentMessage()}
                    {isEditing ? (
                        <div>
                            <textarea
                                ref={textareaRef}
                                value={editedContent}
                                onChange={handleTextareaChange}
                                onBlur={handleUpdate}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdate(); }
                                    if (e.key === 'Escape') { setIsEditing(false); setEditedContent(message.content); }
                                }}
                                className="w-full bg-transparent resize-none focus:outline-none"
                            />
                        </div>
                    ) : (
                        <div className={`prose-custom ${messageFontSizeClass} ${isUser ? 'prose-invert-user' : ''} ${containsArabic ? 'arabic' : ''}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        </div>
                    )}
                </div>
                 <MessageFooter 
                    message={message} 
                    isContextAssemblyRunning={props.isContextAssemblyRunning}
                    isMemoryExtractionRunning={props.isMemoryExtractionRunning}
                />
            </div>
            {isUser && align === 'right' && <div className="p-2 bg-gray-700 rounded-full"><UserCircleIcon className="w-5 h-5 text-gray-300" /></div>}
             {isUser && align !== 'right' && <div className="p-2 bg-gray-700 rounded-full"><UserCircleIcon className="w-5 h-5 text-gray-300" /></div>}
        </motion.div>
    );
};

export default Message;