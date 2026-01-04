
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, LinkIcon, CopyIcon, TrashIcon,
    Bars3Icon, ChatBubbleLeftRightIcon, RocketLaunchIcon
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
    // New Props for Feature Toggles
    isAgentEnabled: boolean;
    onToggleAgent: () => void;
    isLinkPredictionEnabled: boolean;
    onToggleLinkPrediction: () => void;
}

const ChatInput = ({ 
    onSendMessage, 
    isLoading, 
    replyToMessage,
    isAgentEnabled,
    onToggleAgent,
    isLinkPredictionEnabled,
    onToggleLinkPrediction
}: ChatInputProps) => {
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
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 44), maxHeight)}px`;
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
        { key: 'debug', icon: WrenchScrewdriverIcon, label: "Debug", prompt: "جد الخطأ هنا:\n", replace: false },
        { key: 'ideas', icon: LightbulbIcon, label: "أفكار", prompt: "اقترح أفكار إبداعية حول:\n", replace: false },
        { key: 'analyze', icon: BeakerIcon, label: "تحليل", prompt: "حلل النص التالي واستخرج النقاط الأساسية:\n", replace: false },
    ];

    return (
        <div className="w-full flex flex-col items-center relative z-50 overflow-visible">
            
            {/* 🛸 POP-UP MENUS (Elevated) */}
            <AnimatePresence>
                {activeMenu && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-4 w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] p-2 overflow-hidden backdrop-blur-2xl"
                    >
                        <div className="flex flex-wrap gap-2 justify-center p-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {activeMenu === 'macros' ? (
                                macroActions.map((m, i) => (
                                    <button 
                                        key={m.key} 
                                        onClick={() => handleAction(m.prompt, m.replace)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-indigo-600/30 rounded-xl border border-white/5 transition-all active:scale-95"
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
                                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-indigo-600/30 rounded-xl border border-white/5 transition-all active:scale-95"
                                    >
                                        <f.icon className={`w-4 h-4 ${COLORS[(i+10) % COLORS.length]}`} />
                                        <span className="text-xs font-bold text-gray-200">{f.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="bg-white/5 p-1 text-center border-t border-white/5">
                            <button onClick={() => setActiveMenu(null)} className="text-[10px] text-gray-500 font-bold uppercase">إغلاق القائمة</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ⌨️ CONSOLIDATED INPUT AREA */}
            <div className="w-full max-w-full flex flex-col bg-gray-900/90 border border-white/10 p-2 rounded-2xl shadow-xl focus-within:border-indigo-500/50 transition-all backdrop-blur-md overflow-hidden">
                
                {/* Menu Toggle Row */}
                <div className="flex items-center gap-2 mb-2 px-1 overflow-x-auto no-scrollbar">
                     <button 
                        onClick={() => setActiveMenu(activeMenu === 'macros' ? null : 'macros')}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${activeMenu === 'macros' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}
                    >
                        <SparklesIcon className="w-3.5 h-3.5" /> الإجراءات
                    </button>
                    <button 
                        onClick={() => setActiveMenu(activeMenu === 'formatting' ? null : 'formatting')}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${activeMenu === 'formatting' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}
                    >
                        <DocumentTextIcon className="w-3.5 h-3.5" /> التنسيق
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>

                    {/* Integrated Agent & Predict Buttons */}
                    <button 
                        onClick={onToggleAgent}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            isAgentEnabled 
                            ? 'bg-orange-600/20 border-orange-500/50 text-orange-400' 
                            : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300'
                        }`}
                        title={isAgentEnabled ? "Agent Mode Active" : "Enable Agent Mode"}
                    >
                        <RocketLaunchIcon className={`w-3.5 h-3.5 ${isAgentEnabled ? 'animate-pulse' : ''}`} /> 
                        <span className="hidden sm:inline">Agent</span>
                    </button>
                    
                    <button 
                        onClick={onToggleLinkPrediction}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            isLinkPredictionEnabled 
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                            : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300'
                        }`}
                        title={isLinkPredictionEnabled ? "Prediction Active" : "Enable Prediction"}
                    >
                        <LinkIcon className="w-3.5 h-3.5" /> 
                        <span className="hidden sm:inline">Predict</span>
                    </button>

                    <div className="flex-1" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-500 hover:text-indigo-400 rounded-lg transition-colors flex-shrink-0">
                        <PaperclipIcon className="w-4.5 h-4.5" />
                    </button>
                </div>

                <div className="flex items-end gap-2">
                    <div className="flex-1 min-w-0 flex flex-col relative pb-1 px-1">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="اكتب رسالة..."
                            className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-600 resize-none py-1.5 text-[16px] leading-relaxed max-h-[120px] custom-scrollbar overflow-x-hidden"
                            rows={1}
                            dir="auto"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isMobileView) { e.preventDefault(); handleSendMessage(); } }}
                        />
                        {attachment && (
                            <div className="mt-1 flex items-center gap-1.5 bg-indigo-900/40 text-[10px] text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-500/30 w-fit max-w-full">
                                <span className="truncate max-w-[150px]">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)}><XIcon className="w-3 h-3 text-red-400"/></button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleSendMessage} 
                        disabled={(!content.trim() && !attachment) || isLoading} 
                        className={`p-2.5 rounded-xl shadow-lg transition-all mb-1 shrink-0 ${
                            (!content.trim() && !attachment) || isLoading 
                            ? 'bg-gray-800 text-gray-600' 
                            : 'bg-indigo-600 text-white shadow-indigo-500/30'
                        }`}
                    >
                        {isUploading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
        </div>
    );

    async function handleSendMessage() {
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
    }
};

export default ChatInput;
