
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Contact, Prompt } from '@/lib/types';
import { SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon } from '@/components/Icons';
import { usePrompts } from '@/lib/hooks/usePrompts';
import FillPromptVariablesModal from './FillPromptVariablesModal';
import { useConversation } from './providers/ConversationProvider';
import { useUIState } from './providers/UIStateProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

const QuickActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500/50 transition-all min-w-[70px] h-16 group">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 mb-1" />
        <span className="text-[9px] text-gray-500 group-hover:text-gray-200 text-center leading-tight">{label}</span>
    </button>
);

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    
    // Commands & Mentions
    const [commandMode, setCommandMode] = useState<'none' | 'slash' | 'mention'>('none');
    
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();
    const { startAgentRun } = useConversation();

    // Adjust height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [content]);
    
    // Focus reply
    useEffect(() => {
        if (replyToMessage) textareaRef.current?.focus();
    }, [replyToMessage]);

    // Handle Quick Actions
    const handleQuickAction = (text: string, actionType: string = 'append') => {
        if (actionType === 'replace') setContent(text);
        else setContent(prev => prev + (prev ? '\n' : '') + text);
        textareaRef.current?.focus();
        setShowQuickActions(false);
    };

    // Detect / and @
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        
        if (val.endsWith('/')) setCommandMode('slash');
        else if (val.endsWith('@')) setCommandMode('mention');
        else if (!val.includes('/') && !val.includes('@')) setCommandMode('none');
    };

    const handleSend = async () => {
        if ((!content.trim() && !attachment) || isLoading) return;
        
        // Simple command handling for demonstration
        if (content.startsWith('/agent')) {
            startAgentRun(content.replace('/agent', '').trim());
            setContent('');
            return;
        }

        let finalContent = content.trim();
        if (attachment) {
            setIsUploading(true);
            try {
                 const res = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: { 'content-type': attachment.type, 'x-vercel-filename': attachment.name },
                    body: attachment
                });
                const blob = await res.json();
                finalContent += `\n\n[Attachment: ${attachment.name}](${blob.url})`;
            } catch(e) {
                 addNotification({type:'error', title:'Upload Failed'});
            } finally { setIsUploading(false); setAttachment(null); }
        }
        
        onSendMessage(finalContent, []);
        setContent('');
    };

    return (
        <div className="w-full bg-gray-950/80 backdrop-blur-xl border-t border-white/5 p-4 z-40 relative">
            {/* Quick Action Grid (Expandable) */}
            <AnimatePresence>
                {showQuickActions && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-1">
                            <QuickActionButton icon={SummarizeIcon} label="تلخيص" onClick={() => handleQuickAction("لخص ما سبق باختصار.", 'replace')} />
                            <QuickActionButton icon={CodeIcon} label="تحليل كود" onClick={() => handleQuickAction("اشرح الكود التالي بالتفصيل:\n")} />
                            <QuickActionButton icon={SparklesIcon} label="تحسين صياغة" onClick={() => handleQuickAction("أعد صياغة النص التالي ليكون أكثر احترافية:\n")} />
                            <QuickActionButton icon={ArrowsRightLeftIcon} label="ترجمة EN" onClick={() => handleQuickAction("ترجم إلى الإنجليزية:\n")} />
                            <QuickActionButton icon={LightbulbIcon} label="توليد أفكار" onClick={() => handleQuickAction("اقترح 5 أفكار إبداعية حول:\n")} />
                            <QuickActionButton icon={BeakerIcon} label="شرح معقد" onClick={() => handleQuickAction("اشرح لي هذا المفهوم وكأني طفل في الخامسة:\n")} />
                            {/* Add 10 more buttons here for the requested 15+ limit */}
                            <QuickActionButton icon={CodeIcon} label="SQL Query" onClick={() => handleQuickAction("اكتب استعلام SQL لـ:\n")} />
                            <QuickActionButton icon={CodeIcon} label="React Comp" onClick={() => handleQuickAction("أنشئ مكون React يقوم بـ:\n")} />
                            <QuickActionButton icon={CodeIcon} label="Debug" onClick={() => handleQuickAction("ساعدني في اكتشاف الخطأ هنا:\n")} />
                            <QuickActionButton icon={SummarizeIcon} label="TL;DR" onClick={() => handleQuickAction("TL;DR\n")} />
                            <QuickActionButton icon={SparklesIcon} label="نقد بناء" onClick={() => handleQuickAction("انقد النص التالي نقدًا بناءً:\n")} />
                            <QuickActionButton icon={BeakerIcon} label="خطة عمل" onClick={() => handleQuickAction("ضع خطة عمل لتنفيذ:\n")} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Auto-complete Popups */}
            <AnimatePresence>
                {commandMode !== 'none' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} className="absolute bottom-full left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 w-64 mb-2">
                        <p className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700 mb-1">{commandMode === 'slash' ? 'Available Commands' : 'Mention Entity'}</p>
                        {commandMode === 'slash' ? (
                            <>
                                <button onClick={() => { setContent('/agent '); setCommandMode('none'); }} className="block w-full text-left px-2 py-1 text-sm hover:bg-indigo-600 rounded">/agent [goal]</button>
                                <button onClick={() => { setContent('/workflow '); setCommandMode('none'); }} className="block w-full text-left px-2 py-1 text-sm hover:bg-indigo-600 rounded">/workflow [name]</button>
                            </>
                        ) : (
                             <p className="text-xs text-gray-500 italic px-2">Type to filter entities...</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="flex items-end gap-2 bg-gray-900/50 p-2 rounded-2xl border border-white/10 shadow-lg relative">
                 <button 
                    onClick={() => setShowQuickActions(!showQuickActions)} 
                    className={`p-3 rounded-xl transition-colors h-[48px] w-[48px] flex items-center justify-center flex-shrink-0 ${showQuickActions ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <SparklesIcon className="w-5 h-5" />
                </button>
                
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl h-[48px] w-[48px] flex justify-center items-center">
                    <PaperclipIcon className="w-5 h-5" />
                </button>

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInputChange}
                    placeholder="اكتب رسالتك، استخدم / للأوامر، @ للإشارة..."
                    className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-3 max-h-48"
                    rows={1}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />

                <button onClick={handleSend} disabled={(!content.trim() && !attachment) || isLoading} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-[48px] w-[48px] flex justify-center items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                     {isUploading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : <SendIcon className="w-5 h-5" />}
                </button>
            </div>
            
            {attachment && (
                <div className="mt-2 px-2 flex items-center gap-2 text-xs text-indigo-300">
                    <PaperclipIcon className="w-3 h-3" />
                    <span>{attachment.name}</span>
                    <button onClick={() => setAttachment(null)}><XIcon className="w-3 h-3 hover:text-red-400"/></button>
                </div>
            )}
        </div>
    );
};

export default ChatInput;
