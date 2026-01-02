
"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircleIcon, CpuChipIcon } from './Icons';
import type { Message as MessageType, Conversation } from '@/lib/types';
import MessageToolbar from './MessageToolbar';
import MessageFooter from './MessageFooter';
import { useUIState } from './providers/UIStateProvider';

const MotionDiv = motion.div as any;

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

const Message: React.FC<MessageProps> = (props) => {
    const { message, onUpdateMessage } = props;
    const { isMobileView } = useUIState();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isUser = message.role === 'user';
    const hasHtml = message.content.includes('<html');

    const handleSaveEdit = () => {
        if (editedContent.trim() && editedContent !== message.content) {
            onUpdateMessage(message.id, editedContent);
        }
        setIsEditing(false);
    };

    if (isMobileView) {
        return (
            <MotionDiv
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex flex-col gap-1 mb-4 ${isUser ? 'items-end' : 'items-start'}`}
            >
                <div className={`px-4 py-2 shadow-sm relative group ${isUser ? 'mobile-chat-bubble-user text-white' : 'mobile-chat-bubble-ai text-gray-200'}`}>
                    <div className="prose-custom text-[15px] leading-relaxed">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    
                    <div className="absolute -top-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
                         <MessageToolbar
                            isBookmarked={!!message.isBookmarked}
                            isCollapsed={isCollapsed}
                            isUser={isUser}
                            onCopy={() => navigator.clipboard.writeText(message.content)}
                            onBookmark={() => props.onToggleBookmark(message.id)}
                            onSummarize={() => props.onSummarize(message.content)}
                            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                            onSetAlign={props.onSetConversationAlign}
                            onEdit={() => setIsEditing(true)}
                            onDelete={props.onDelete}
                            onRegenerate={props.onRegenerate}
                            onInspect={props.onInspect}
                            onViewHtml={hasHtml ? () => props.onViewHtml(message.content) : undefined}
                            onReply={() => props.onReply(message)}
                            onViewContext={props.onViewContext}
                        />
                    </div>
                </div>
                <div className="px-2">
                    <MessageFooter
                        message={message}
                        isContextAssemblyRunning={props.isContextAssemblyRunning}
                        isMemoryExtractionRunning={props.isMemoryExtractionRunning}
                        findMessageById={props.findMessageById}
                    />
                </div>
            </MotionDiv>
        );
    }

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 group w-full mb-8 desktop-message-row"
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-1 ${isUser ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-indigo-400 border border-white/10'}`}>
                {isUser ? <UserCircleIcon className="w-6 h-6" /> : <CpuChipIcon className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="relative">
                    <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 translate-y-2 group-hover:translate-y-0">
                        <MessageToolbar
                            isBookmarked={!!message.isBookmarked}
                            isCollapsed={isCollapsed}
                            isUser={isUser}
                            onCopy={() => navigator.clipboard.writeText(message.content)}
                            onBookmark={() => props.onToggleBookmark(message.id)}
                            onSummarize={() => props.onSummarize(message.content)}
                            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                            onSetAlign={props.onSetConversationAlign}
                            onEdit={() => setIsEditing(true)}
                            onDelete={props.onDelete}
                            onRegenerate={props.onRegenerate}
                            onInspect={props.onInspect}
                            onViewHtml={hasHtml ? () => props.onViewHtml(message.content) : undefined}
                            onReply={() => props.onReply(message)}
                            onViewContext={props.onViewContext}
                        />
                    </div>
                    
                    <div className={`rounded-2xl p-6 ${isUser ? 'bg-gray-800/40 border border-white/5 shadow-inner' : 'bg-transparent border border-white/5'}`}>
                        {isEditing ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full bg-gray-900 p-4 rounded-xl text-sm border border-indigo-500/50 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px]"
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 bg-gray-700 text-xs rounded-lg hover:bg-gray-600">إلغاء</button>
                                    <button onClick={handleSaveEdit} className="px-4 py-1.5 bg-indigo-600 text-xs rounded-lg hover:bg-indigo-500 text-white font-bold">حفظ التغييرات</button>
                                </div>
                            </div>
                        ) : (
                             <div className="prose-custom max-w-none text-[16px]">
                                {!isCollapsed ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                ) : (
                                    <p className="italic text-gray-500 cursor-pointer" onClick={() => setIsCollapsed(false)}>المحتوى مخفي... (انقر للإظهار)</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                 <MessageFooter
                    message={message}
                    isContextAssemblyRunning={props.isContextAssemblyRunning}
                    isMemoryExtractionRunning={props.isMemoryExtractionRunning}
                    findMessageById={props.findMessageById}
                />
            </div>
        </MotionDiv>
    );
};

export default Message;
