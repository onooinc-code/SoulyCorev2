"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircleIcon, CpuChipIcon } from './Icons';
import type { Message as MessageType, Conversation } from '@/lib/types';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';

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
    onViewContext: (type: 'prompt' | 'system' | 'config') => void;
}

const Message = (props: MessageProps) => {
    const { message, onUpdateMessage } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isUser = message.role === 'user';
    const align = props.currentConversation?.ui_settings?.textAlign || 'left';

    const handleSaveEdit = () => {
        if (editedContent.trim() && editedContent !== message.content) {
            onUpdateMessage(message.id, editedContent);
        }
        setIsEditing(false);
    };

    const hasHtml = message.content.includes('<html');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-start gap-4 group ${align === 'right' ? 'justify-end' : ''}`}
        >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-600' : 'bg-indigo-600'}`}>
                {isUser ? <UserCircleIcon className="w-6 h-6" /> : <CpuChipIcon className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0 max-w-4xl">
                <div className="relative">
                    <div className="absolute top-0 right-0 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <MessageToolbar
                            isBookmarked={!!message.isBookmarked}
                            isCollapsed={isCollapsed}
                            isUser={isUser}
                            onCopy={() => navigator.clipboard.writeText(message.content)}
                            onBookmark={() => props.onToggleBookmark(message.id)}
                            onSummarize={() => props.onSummarize(message.content)}
                            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                            onSetAlign={props.onSetConversationAlign}
                            onEdit={() => { setIsEditing(true); setEditedContent(message.content); }}
                            onDelete={props.onDelete}
                            onRegenerate={props.onRegenerate}
                            onInspect={props.onInspect}
                            onViewHtml={hasHtml ? () => props.onViewHtml(message.content) : undefined}
                            onReply={() => props.onReply(message)}
                            onViewContext={props.onViewContext}
                        />
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <AnimatePresence initial={false}>
                        {isEditing ? (
                            <motion.div key="editing" initial={{opacity:0}} animate={{opacity:1}}>
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded-md text-sm"
                                    rows={Math.max(3, editedContent.split('\n').length)}
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 text-xs rounded-md">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-600 text-xs rounded-md">Cancel</button>
                                </div>
                            </motion.div>
                        ) : (
                             <motion.div key="viewing" className="prose-custom">
                                {!isCollapsed ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                ) : (
                                    <p className="italic text-gray-400">Message content collapsed...</p>
                                )}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
                 <MessageFooter
                    message={message}
                    isContextAssemblyRunning={props.isContextAssemblyRunning}
                    isMemoryExtractionRunning={props.isMemoryExtractionRunning}
                    findMessageById={props.findMessageById}
                />
            </div>
        </motion.div>
    );
};

export default Message;
