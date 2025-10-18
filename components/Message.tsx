"use client";

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-light.css';
import { useConversation } from './providers/ConversationProvider';
import { useSettings } from './providers/SettingsProvider';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';
import { UserCircleIcon, CpuChipIcon } from './Icons';
import type { Message as MessageType } from '@/lib/types';
import { motion } from 'framer-motion';

interface MessageProps {
    message: MessageType;
    onReply: (message: MessageType) => void;
    onSummarizeRequest: (content: string) => void;
    onInspectRequest: (messageId: string) => void;
    onViewHtmlRequest: (htmlContent: string) => void;
}

const Message = ({ message, onReply, onSummarizeRequest, onInspectRequest, onViewHtmlRequest }: MessageProps) => {
    const { deleteMessage, updateMessage, toggleBookmark, regenerateAiResponse, regenerateUserPromptAndGetResponse } = useConversation();
    const { settings } = useSettings();
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);

    const isUser = message.role === 'user';
    const messageFontSizeClass = {
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    }[settings?.global_ui_settings?.messageFontSize || 'sm'];

    const handleUpdateMessage = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        updateMessage(message.id, editedContent);
        setIsEditing(false);
    };
    
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(message.content);
        // Maybe show a notification
    }, [message.content]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative px-4 py-4"
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    {isUser ? (
                        <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    ) : (
                        <CpuChipIcon className="w-8 h-8 text-indigo-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200">{isUser ? "You" : "SoulyCore"}</div>
                    {isEditing ? (
                        <div className="mt-1">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono"
                                rows={Math.max(3, editedContent.split('\n').length)}
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 text-xs rounded-md">Save</button>
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-600 text-xs rounded-md">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className={`markdown-body prose-custom ${messageFontSizeClass} mt-1`} style={{ backgroundColor: 'transparent', color: '#D1D5DB' }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        </div>
                    )}
                    <MessageFooter message={message} isContextAssemblyRunning={false} isMemoryExtractionRunning={false} />
                </div>
            </div>
            <MessageToolbar 
                message={message}
                isHovering={isHovering}
                onCopy={handleCopy}
                onSummarize={onSummarizeRequest}
                onToggleBookmark={toggleBookmark}
                onDeleteMessage={deleteMessage}
                onUpdateMessage={handleUpdateMessage}
                onRegenerate={isUser ? regenerateUserPromptAndGetResponse : regenerateAiResponse}
                onInspect={onInspectRequest}
                onViewHtml={onViewHtmlRequest}
            />
        </motion.div>
    );
};

export default Message;
