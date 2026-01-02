
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, CommandLineIcon,
    LinkIcon, CubeIcon, CopyIcon, TrashIcon,
    ClockIcon, Bars3Icon, ChatBubbleLeftRightIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import { useUIState } from './providers/UIStateProvider';

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
        className="flex items-center justify-center gap-2 p-2 min-w-[36px] h-8 rounded-lg bg-gray-800/60 hover:bg-indigo-600/30 border border-white/5 transition-all active:scale-90 flex-shrink-0"
        title={label}
    >
        <Icon className={`w-3.5 h-3.5 ${COLORS[colorIndex % COLORS.length]}`} />
        {showLabel && <span className="text-[10px] text-gray-300 font-bold whitespace-nowrap">{label}</span>}
    </button>
);

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
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
        setTimeout(() => textareaRef.current?.focus(), 10);
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
        <div className="w-full flex flex-col gap-2 p-3 sm:p-4 max-w-full overflow-hidden">
            
            {/* 🛠️ TOP TOOLBAR: MACROS (Restored & Scrollable) */}
            <div className="horizontal-toolbar mask-edge-fade no-scrollbar">
                {macroActions.map((m, i) => (
                    <ToolbarButton 
                        key={m.key} 
                        icon={m.icon} 
                        label={m.label} 
                        onClick={() => handleAction(m.prompt, m.replace)} 
                        colorIndex={i} 
                        showLabel={!isMobileView} 
                    />
                ))}
                <div className="flex-shrink-0 w-8" /> {/* Edge padding */}
            </div>

            {/* ⌨️ MAIN INPUT AREA */}
            <div className="flex items-end gap-2 bg-gray-900/80 border border-white/10 p-2 rounded-2xl focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all min-h-[48px] w-full max-w-full overflow-hidden backdrop-blur-md">
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-indigo-400 rounded-xl h-10 w-10 flex items-center justify-center shrink-0 transition-colors">
                    <PaperclipIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0 flex flex-col relative py-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="اكتب رسالة..."
                        className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-1 text-[16px] leading-relaxed max-h-[120px] custom-scrollbar"
                        rows={1}
                        dir="auto"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isMobileView) { e.preventDefault(); handleSend(); } }}
                    />
                    {attachment && (
                        <div className="mt-2 flex items-center gap-1.5 bg-indigo-900/40 text-[10px] text-indigo-200 px-2 py-1 rounded-md border border-indigo-500/30 w-fit max-w-[200px]">
                            <span className="truncate">{attachment.name}</span>
                            <button onClick={() => setAttachment(null)}><XIcon className="w-3 h-3 text-red-400"/></button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSend} 
                    disabled={(!content.trim() && !attachment) || isLoading} 
                    className={`p-2.5 rounded-xl shadow-lg transition-all h-10 w-10 flex items-center justify-center shrink-0 ${
                        (!content.trim() && !attachment) || isLoading 
                        ? 'bg-gray-800 text-gray-600' 
                        : 'bg-indigo-600 text-white active:scale-95 shadow-indigo-500/30 border border-indigo-400/30'
                    }`}
                >
                    {isUploading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <SendIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* 🖋️ BOTTOM TOOLBAR: FORMATTING (Restored & Scrollable) */}
            <div className="horizontal-toolbar mask-edge-fade no-scrollbar border-t border-white/5 pt-2">
                {formatActions.map((f, i) => (
                    <ToolbarButton 
                        key={f.label} 
                        icon={f.icon} 
                        label={f.label} 
                        onClick={f.action} 
                        colorIndex={i + 10} 
                        showLabel={!isMobileView} 
                    />
                ))}
                <div className="flex-shrink-0 w-8" /> {/* Edge padding */}
            </div>
        </div>
    );
};

export default ChatInput;
