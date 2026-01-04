
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-3 px-2"
            >
                <div className={`mobile-chat-bubble-base ${isUser ? 'mobile-chat-bubble-user' : 'mobile-chat-bubble-ai'} group`}>
                    
                    {/* Header: Role Label */}
                    <div className="flex items-center gap-2 mb-2 opacity-70 text-[10px] uppercase tracking-wider font-bold">
                        {isUser ? (
                            <>
                                <UserCircleIcon className="w-3 h-3 text-indigo-400" />
                                <span>أنت</span>
                            </>
                        ) : (
                            <>
                                <CpuChipIcon className="w-3 h-3 text-emerald-400" />
                                <span>الذكاء الاصطناعي</span>
                            </>
                        )}
                    </div>

                    <div className="prose-custom text-[15px] leading-relaxed w-full">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    
                    <div className="absolute -top-3 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
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

                    <div className="mt-2 pt-2 border-t border-white/5">
                        <MessageFooter
                            message={message}
                            isContextAssemblyRunning={props.isContextAssemblyRunning}
                            isMemoryExtractionRunning={props.isMemoryExtractionRunning}
                            findMessageById={props.findMessageById}
                        />
                    </div>
                </div>
            </MotionDiv>
        );
    }

    // Desktop Layout (Keeping similar logic but enforcing RTL and full width container feel)
    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col w-full mb-6 desktop-message-row px-4"
        >
            <div className={`relative p-6 rounded-2xl border ${isUser ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-gray-800/40 border-gray-700/50'} w-full group`}>
                
                {/* Marker Line */}
                <div className={`absolute right-0 top-6 bottom-6 w-1 rounded-l-full ${isUser ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isUser ? 'bg-indigo-600/20 text-indigo-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                        {isUser ? <UserCircleIcon className="w-6 h-6" /> : <CpuChipIcon className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
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

                        {isEditing ? (
                            <div className="space-y-3" dir="rtl">
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
                             <div className="prose-custom max-w-none text-[16px] w-full" dir="rtl">
                                {!isCollapsed ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                ) : (
                                    <p className="italic text-gray-500 cursor-pointer" onClick={() => setIsCollapsed(false)}>المحتوى مخفي... (انقر للإظهار)</p>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-4 pt-2 border-t border-white/5" dir="rtl">
                            <MessageFooter
                                message={message}
                                isContextAssemblyRunning={props.isContextAssemblyRunning}
                                isMemoryExtractionRunning={props.isMemoryExtractionRunning}
                                findMessageById={props.findMessageById}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MotionDiv>
    );
};

export default Message;
