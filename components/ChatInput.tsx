
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, CommandLineIcon,
    LinkIcon, CubeIcon, BookmarkIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

const ToolbarButton = ({ icon: Icon, label, onClick, colorClass = "text-gray-400 group-hover:text-indigo-400" }: { icon: any, label: string, onClick: () => void, colorClass?: string }) => (
    <button 
        onClick={onClick} 
        className="group flex flex-col items-center justify-center min-w-[72px] h-[64px] p-1 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-transparent hover:border-indigo-500/30 transition-all duration-200"
        title={label}
    >
        <Icon className={`w-5 h-5 mb-1.5 transition-colors ${colorClass}`} />
        <span className="text-[9px] text-gray-500 group-hover:text-gray-200 font-medium leading-none text-center px-1">{label}</span>
    </button>
);

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Command/Mention State
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();
    const { startAgentRun } = useConversation();

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [content]);
    
    useEffect(() => {
        if (replyToMessage) textareaRef.current?.focus();
    }, [replyToMessage]);

    const handleAction = (text: string, replace = false) => {
        if (replace) setContent(text);
        else setContent(prev => prev + (prev ? '\n' : '') + text);
        textareaRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        if (val.endsWith('/')) setShowCommandMenu(true);
        else setShowCommandMenu(false);
    };

    const handleSend = async () => {
        if ((!content.trim() && !attachment) || isLoading) return;
        
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
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    return (
        <div className="w-full bg-gray-950/90 backdrop-blur-xl border-t border-white/5 pb-2 pt-2 z-40 relative shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            
            {/* 1. Visible Horizontal Toolbar */}
            <div className="px-4 mb-2 overflow-x-auto no-scrollbar flex items-center gap-2 pb-2 mask-linear-fade">
                <ToolbarButton icon={SummarizeIcon} label="تلخيص" onClick={() => handleAction("لخص ما سبق باختصار.", true)} colorClass="text-purple-400" />
                <ToolbarButton icon={SparklesIcon} label="تحسين" onClick={() => handleAction("أعد صياغة النص التالي ليكون أكثر احترافية:\n")} colorClass="text-yellow-400" />
                <ToolbarButton icon={CodeIcon} label="شرح كود" onClick={() => handleAction("اشرح الكود التالي بالتفصيل:\n")} colorClass="text-blue-400" />
                <ToolbarButton icon={ArrowsRightLeftIcon} label="ترجمة EN" onClick={() => handleAction("ترجم إلى الإنجليزية:\n")} />
                <ToolbarButton icon={ArrowsRightLeftIcon} label="ترجمة AR" onClick={() => handleAction("ترجم إلى العربية:\n")} />
                <ToolbarButton icon={LightbulbIcon} label="أفكار" onClick={() => handleAction("اقترح 5 أفكار إبداعية حول:\n")} colorClass="text-yellow-300" />
                <ToolbarButton icon={BeakerIcon} label="تبسيط" onClick={() => handleAction("اشرح لي هذا المفهوم وكأني طفل في الخامسة:\n")} />
                <ToolbarButton icon={WrenchScrewdriverIcon} label="Debug" onClick={() => handleAction("ساعدني في اكتشاف الخطأ هنا:\n")} colorClass="text-red-400" />
                <ToolbarButton icon={DocumentTextIcon} label="خطة" onClick={() => handleAction("ضع خطة عمل لتنفيذ:\n")} />
                <ToolbarButton icon={CommandLineIcon} label="SQL" onClick={() => handleAction("اكتب استعلام SQL لـ:\n")} />
                <ToolbarButton icon={CodeIcon} label="React" onClick={() => handleAction("أنشئ مكون React يقوم بـ:\n")} colorClass="text-cyan-400" />
                <ToolbarButton icon={LinkIcon} label="تحليل رابط" onClick={() => handleAction("حلل محتوى الرابط التالي:\n")} />
                <ToolbarButton icon={CubeIcon} label="Entity" onClick={() => handleAction("/extract-entities ")} />
                <ToolbarButton icon={BookmarkIcon} label="Save" onClick={() => handleAction("Save this to memory.")} />
                <ToolbarButton icon={SparklesIcon} label="نقد" onClick={() => handleAction("انقد النص التالي نقدًا بناءً:\n")} />
            </div>

            {/* 2. Command Menu Popover */}
            <AnimatePresence>
                {showCommandMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }} className="absolute bottom-full left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 w-64 mb-2 z-50">
                        <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700 mb-1">Commands</div>
                        <button onClick={() => { setContent('/agent '); setShowCommandMenu(false); }} className="block w-full text-left px-2 py-2 text-sm hover:bg-indigo-600 rounded text-gray-200">/agent [goal]</button>
                        <button onClick={() => { setContent('/workflow '); setShowCommandMenu(false); }} className="block w-full text-left px-2 py-2 text-sm hover:bg-indigo-600 rounded text-gray-200">/workflow [name]</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Input Area */}
            <div className="px-4 pb-2">
                <div className="flex items-end gap-2 bg-gray-900 border border-white/10 p-2 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                    
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl h-[44px] w-[44px] flex justify-center items-center flex-shrink-0 transition-colors" title="Attach File">
                        <PaperclipIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleInputChange}
                            placeholder="اكتب رسالتك، استخدم / للأوامر، @ للإشارة..."
                            className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-3 text-sm leading-relaxed max-h-[200px]"
                            rows={1}
                            dir="auto"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                         {attachment && (
                            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 bg-gray-800 text-xs text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                                <PaperclipIcon className="w-3 h-3" />
                                <span className="max-w-[150px] truncate">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)}><XIcon className="w-3 h-3 hover:text-red-400"/></button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleSend} 
                        disabled={(!content.trim() && !attachment) || isLoading} 
                        className={`p-3 rounded-xl h-[44px] w-[44px] flex justify-center items-center shadow-lg transition-all duration-200 flex-shrink-0 ${
                            (!content.trim() && !attachment) || isLoading 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isUploading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
