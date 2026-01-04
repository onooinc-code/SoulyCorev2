
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, LinkIcon, CopyIcon, TrashIcon,
    Bars3Icon, ChatBubbleLeftRightIcon, ChevronUpIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { useUIState } from './providers/UIStateProvider';

const COLORS = [
    'text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 
    'text-pink-400', 'text-indigo-400', 'text-red-400', 'text-teal-400', 
    'text-orange-400', 'text-cyan-400'
];

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'macros' | 'formatting' | null>(null);
    
    const { isMobileView } = useUIState();
    const { addNotification } = useNotification();
    const { startAgentRun } = useConversation();
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const maxHeight = isMobileView ? 120 : 250;
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 40), maxHeight)}px`;
        }
    }, [content, isMobileView]);

    const handleAction = (text: string, replace = false) => {
        if (replace) setContent(text);
        else setContent(prev => prev + (prev ? '\n' : '') + text);
        setActiveMenu(null);
        setTimeout(() => textareaRef.current?.focus(), 10);
    };

    const modifyText = (modifier: (text: string) => string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const modified = selectedText ? modifier(selectedText) : modifier(content);
        const newContent = selectedText ? content.substring(0, start) + modified + content.substring(end) : modified;
        setContent(newContent);
        setActiveMenu(null);
        setTimeout(() => textarea.focus(), 10);
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
            } catch(e) { addNotification({type:'error', title:'Upload Failed'}); } finally { setIsUploading(false); setAttachment(null); }
        }
        onSendMessage(finalContent, []);
        setContent('');
    };

    const formatActions = [
        { icon: TrashIcon, label: 'مسح', action: () => setContent('') },
        { icon: CopyIcon, label: 'نسخ', action: () => { navigator.clipboard.writeText(content).then(() => addNotification({type:'success', title:'تم النسخ'})); } },
        { icon: DocumentTextIcon, label: 'عريض', action: () => modifyText(t => `**${t}**`) },
        { icon: CodeIcon, label: 'كود', action: () => modifyText(t => `\`${t}\``) },
        { icon: LinkIcon, label: 'رابط', action: () => modifyText(t => `[${t}](url)`) },
        { icon: Bars3Icon, label: 'قائمة', action: () => modifyText(t => t.split('\n').map(l => `- ${l}`).join('\n')) },
        { icon: ChatBubbleLeftRightIcon, label: 'اقتباس', action: () => modifyText(t => t.split('\n').map(l => `> ${l}`).join('\n')) },
    ];

    const macroActions = [
        { key: 'summarize', icon: SummarizeIcon, label: "تلخيص", prompt: "لخص ما سبق باختصار.", replace: true },
        { key: 'enhance', icon: SparklesIcon, label: "تحسين", prompt: "أعد صياغة النص بلمسة احترافية:\n", replace: false },
        { key: 'explain', icon: CodeIcon, label: "شرح", prompt: "اشرح لي الكود التالي:\n", replace: false },
        { key: 'trans_en', icon: ArrowsRightLeftIcon, label: "EN", prompt: "ترجم إلى الإنجليزية:\n", replace: false },
        { key: 'trans_ar', icon: ArrowsRightLeftIcon, label: "AR", prompt: "ترجم إلى العربية:\n", replace: false },
        { key: 'debug', icon: WrenchScrewdriverIcon, label: "Debug", prompt: "جد الخطأ هنا:\n", replace: false },
        { key: 'ideas', icon: LightbulbIcon, label: "أفكار", prompt: "اقترح أفكار إبداعية حول:\n", replace: false },
        { key: 'analyze', icon: BeakerIcon, label: "تحليل", prompt: "حلل النص التالي واستخرج النقاط الأساسية:\n", replace: false },
    ];

    return (
        <div className="w-full flex flex-col items-center px-3 pb-3 sm:pb-6 relative max-w-full overflow-visible">
            
            {/* 🛸 POP-UP MENUS */}
            <AnimatePresence>
                {activeMenu && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-3 w-[95%] max-w-lg bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-2 justify-center p-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {activeMenu === 'macros' ? (
                                macroActions.map((m, i) => (
                                    <button 
                                        key={m.key} 
                                        onClick={() => handleAction(m.prompt, m.replace)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-indigo-600/30 rounded-xl border border-white/5 transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <m.icon className={`w-4 h-4 ${COLORS[i % COLORS.length]}`} />
                                        <span className="text-xs font-bold text-gray-200">{m.label}</span>
                                    </button>
                                ))
                            ) : (
                                formatActions.map((f, i) => (
                                    <button 
                                        key={f.label} 
                                        onClick={f.action}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-indigo-600/30 rounded-xl border border-white/5 transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        <f.icon className={`w-4 h-4 ${COLORS[(i+10) % COLORS.length]}`} />
                                        <span className="text-xs font-bold text-gray-200">{f.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ⌨️ MAIN INPUT PILL */}
            <div className="w-full max-w-full flex flex-col gap-2 bg-gray-900/80 border border-white/10 p-2 rounded-3xl shadow-2xl focus-within:border-indigo-500/50 transition-all backdrop-blur-md">
                
                <div className="flex items-end gap-1 sm:gap-2 min-w-0">
                    {/* Multi-Menu Toggles */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button 
                            onClick={() => setActiveMenu(activeMenu === 'macros' ? null : 'macros')} 
                            className={`p-2 rounded-full transition-colors ${activeMenu === 'macros' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-400 hover:bg-white/5'}`}
                            title="Quick Actions"
                        >
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setActiveMenu(activeMenu === 'formatting' ? null : 'formatting')} 
                            className={`p-2 rounded-full transition-colors ${activeMenu === 'formatting' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-400 hover:bg-white/5'}`}
                            title="Formatting Tools"
                        >
                            <DocumentTextIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 self-center" />

                    {/* Text Input */}
                    <div className="flex-1 min-w-0 flex flex-col relative py-1">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="اكتب رسالة..."
                            className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-1.5 text-[16px] leading-relaxed max-h-[120px] custom-scrollbar overflow-x-hidden"
                            rows={1}
                            dir="auto"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isMobileView) { e.preventDefault(); handleSend(); } }}
                        />
                        {attachment && (
                            <div className="mt-1 flex items-center gap-1.5 bg-indigo-900/40 text-[10px] text-indigo-200 px-2 py-1 rounded-md border border-indigo-500/30 w-fit max-w-full">
                                <span className="truncate">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)}><XIcon className="w-3 h-3 text-red-400"/></button>
                            </div>
                        )}
                    </div>

                    {/* File & Send */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-500 hover:text-indigo-400 hover:bg-white/5 rounded-full transition-colors">
                            <PaperclipIcon className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={handleSend} 
                            disabled={(!content.trim() && !attachment) || isLoading} 
                            className={`p-3 rounded-full shadow-lg transition-all active:scale-90 ${
                                (!content.trim() && !attachment) || isLoading 
                                ? 'bg-gray-800 text-gray-600' 
                                : 'bg-indigo-600 text-white shadow-indigo-500/30'
                            }`}
                        >
                            {isUploading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <SendIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
