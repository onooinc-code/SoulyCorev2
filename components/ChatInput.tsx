
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, CommandLineIcon,
    LinkIcon, CubeIcon, CopyIcon, TrashIcon, EditIcon,
    ClockIcon, MinusIcon, Bars3Icon, ChatBubbleLeftRightIcon,
    ChevronDownIcon, ChevronUpIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';
import { useUIState } from './providers/UIStateProvider';

const MotionDiv = motion.div as any;

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

const COLORS = [
    'text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 
    'text-pink-400', 'text-indigo-400', 'text-red-400', 'text-teal-400', 
    'text-orange-400', 'text-cyan-400'
];

interface ToolbarButtonProps {
    icon: any;
    label: string;
    onClick: () => void;
    colorIndex: number;
    showLabel?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, label, onClick, colorIndex, showLabel = true }) => (
    <button 
        onClick={onClick} 
        className="flex items-center justify-center gap-2 px-3 py-2 min-w-[40px] h-9 rounded-xl bg-gray-800/40 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 transition-all active:scale-90"
        title={label}
    >
        <Icon className={`w-4 h-4 ${COLORS[colorIndex % COLORS.length]}`} />
        {showLabel && <span className="text-[10px] text-gray-300 font-bold whitespace-nowrap hidden sm:inline">{label}</span>}
    </button>
);

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showToolbars, setShowToolbars] = useState(false); // Default false for mobile cleaner view
    
    const { settings, saveSettings } = useSettings();
    const { isMobileView } = useUIState();
    const { addNotification } = useNotification();
    const { startAgentRun } = useConversation();
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 40), 160)}px`;
        }
    }, [content]);

    const handleAction = (text: string, replace = false) => {
        if (replace) setContent(text);
        else setContent(prev => prev + (prev ? '\n' : '') + text);
        textareaRef.current?.focus();
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

    const modifyText = (modifier: (text: string) => string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const modified = selectedText ? modifier(selectedText) : modifier(content);
        const newContent = selectedText ? content.substring(0, start) + modified + content.substring(end) : modified;
        setContent(newContent);
        setTimeout(() => textarea.focus(), 10);
    };

    const formatActions = [
        { icon: TrashIcon, label: 'Clear', action: () => setContent('') },
        { icon: CopyIcon, label: 'Copy', action: () => navigator.clipboard.writeText(content).then(() => addNotification({type:'success', title:'Copied'})) },
        { icon: DocumentTextIcon, label: 'Bold', action: () => modifyText(t => `**${t}**`) },
        { icon: CodeIcon, label: 'Code', action: () => modifyText(t => `\`${t}\``) },
        { icon: LinkIcon, label: 'Link', action: () => modifyText(t => `[${t}](url)`) },
        { icon: Bars3Icon, label: 'List', action: () => modifyText(t => t.split('\n').map(l => `- ${l}`).join('\n')) },
        { icon: ChatBubbleLeftRightIcon, label: 'Quote', action: () => modifyText(t => t.split('\n').map(l => `> ${l}`).join('\n')) },
        { icon: ClockIcon, label: 'Time', action: () => handleAction(new Date().toLocaleTimeString()) },
    ];

    const macroActions = [
        { key: 'summarize', icon: SummarizeIcon, label: "تلخيص", prompt: "لخص ما سبق.", replace: true },
        { key: 'enhance', icon: SparklesIcon, label: "تحسين", prompt: "أعد صياغة النص بلمسة احترافية:\n", replace: false },
        { key: 'explain', icon: CodeIcon, label: "شرح", prompt: "اشرح لي الكود التالي:\n", replace: false },
        { key: 'trans_en', icon: ArrowsRightLeftIcon, label: "EN", prompt: "ترجم إلى الإنجليزية:\n", replace: false },
        { key: 'trans_ar', icon: ArrowsRightLeftIcon, label: "AR", prompt: "ترجم إلى العربية:\n", replace: false },
        { key: 'debug', icon: WrenchScrewdriverIcon, label: "Debug", prompt: "جد الخطأ هنا:\n", replace: false },
        { key: 'ideas', icon: LightbulbIcon, label: "أفكار", prompt: "اقترح أفكار حول:\n", replace: false },
        { key: 'plan', icon: CommandLineIcon, label: "خطة", prompt: "ارسم خطة عمل لـ:\n", replace: false },
    ];

    return (
        <div className="w-full flex flex-col gap-2 p-2 sm:p-4 max-w-full overflow-hidden">
            
            <AnimatePresence>
                {showToolbars && (
                    <MotionDiv initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="space-y-2 overflow-hidden">
                        {/* Macro Toolbar - Horizontal Scroll */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edge-fade py-1">
                            {macroActions.map((m, i) => (
                                <ToolbarButton key={m.key} icon={m.icon} label={m.label} onClick={() => handleAction(m.prompt, m.replace)} colorIndex={i} />
                            ))}
                            <div className="flex-shrink-0 w-8"></div>
                        </div>
                        {/* Formatting Toolbar - Horizontal Scroll */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edge-fade py-1">
                            {formatActions.map((f, i) => (
                                <ToolbarButton key={f.label} icon={f.icon} label={f.label} onClick={f.action} colorIndex={i + 10} />
                            ))}
                            <div className="flex-shrink-0 w-8"></div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>

            {/* Input Row */}
            <div className="flex items-end gap-2 bg-gray-900 border border-white/10 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all min-h-[48px] max-w-full overflow-hidden">
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                
                <button 
                    onClick={() => setShowToolbars(!showToolbars)} 
                    className={`p-2 rounded-xl transition-colors ${showToolbars ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-white'}`}
                    title="Toggle Toolbars"
                >
                    {showToolbars ? <ChevronDownIcon className="w-5 h-5"/> : <ChevronUpIcon className="w-5 h-5"/>}
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white rounded-xl">
                    <PaperclipIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0 flex flex-col relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-2 text-base leading-snug max-h-[160px] no-scrollbar"
                        rows={1}
                        dir="auto"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isMobileView) { e.preventDefault(); handleSend(); } }}
                    />
                    {attachment && (
                        <div className="mt-1 flex items-center gap-2 bg-gray-800 text-[10px] text-indigo-300 px-2 py-1 rounded-lg border border-indigo-500/30 w-fit max-w-[200px] truncate">
                            <span className="truncate">{attachment.name}</span>
                            <button onClick={() => setAttachment(null)}><XIcon className="w-3 h-3 text-red-400"/></button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSend} 
                    disabled={(!content.trim() && !attachment) || isLoading} 
                    className={`p-3 rounded-xl shadow-lg transition-all ${
                        (!content.trim() && !attachment) || isLoading 
                        ? 'bg-gray-800 text-gray-500' 
                        : 'bg-indigo-600 text-white active:scale-90 hover:shadow-indigo-500/40'
                    }`}
                >
                    {isUploading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <SendIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
