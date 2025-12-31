
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, CommandLineIcon,
    LinkIcon, CubeIcon, BookmarkIcon, ClipboardPasteIcon, CopyIcon, TrashIcon, CheckIcon, EditIcon,
    ScissorsIcon, ClockIcon, MinusIcon, Bars3Icon, ChatBubbleLeftRightIcon,
    MenuIcon, ChevronDownIcon, ChevronUpIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';

const MotionDiv = motion.div as any;

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

const COLORS = [
    'text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 
    'text-pink-400', 'text-indigo-400', 'text-red-400', 'text-teal-400', 
    'text-orange-400', 'text-cyan-400', 'text-lime-400', 'text-amber-400'
];

interface ToolbarButtonProps {
    icon: any;
    label: string;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    colorIndex: number;
    onEdit?: () => void;
    isEditing?: boolean;
    className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, label, onClick, onContextMenu, colorIndex, onEdit, isEditing, className }) => (
    <div className={`relative group flex-shrink-0 ${className || ''}`}>
        <button 
            onClick={onClick} 
            onContextMenu={onContextMenu}
            className="flex items-center justify-center gap-2 px-3 h-9 min-w-[40px] rounded-lg bg-gray-800/60 hover:bg-gray-700 border border-white/5 hover:border-indigo-500/30 transition-all duration-200 relative whitespace-nowrap active:scale-95 touch-manipulation"
            title={label}
        >
            <Icon className={`w-4 h-4 transition-colors ${COLORS[colorIndex % COLORS.length]}`} />
            <span className="text-[10px] text-gray-300 font-medium hidden sm:inline-block">{label}</span>
        </button>
        {isEditing && onEdit && (
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="absolute -top-2 -right-2 bg-gray-900 text-gray-300 rounded-full p-1 border border-gray-600 hover:text-white hover:bg-indigo-600 shadow-md z-10"
            >
                <EditIcon className="w-2.5 h-2.5" />
            </button>
        )}
    </div>
);

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Command/Mention State
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    
    // Customization State
    const { settings, saveSettings } = useSettings();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingButtonKey, setEditingButtonKey] = useState<string | null>(null);
    const [newButtonLabel, setNewButtonLabel] = useState('');
    const [newButtonPrompt, setNewButtonPrompt] = useState('');

    // UI State for Mobile - Default to true but user can toggle
    const [showToolbars, setShowToolbars] = useState(true);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();
    const { startAgentRun } = useConversation();

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 44), 160)}px`;
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

    const modifyText = (modifier: (text: string) => string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        if (!selectedText) {
             const modified = modifier(content);
             setContent(modified);
             return;
        }

        const modifiedText = modifier(selectedText);
        const newContent = content.substring(0, start) + modifiedText + content.substring(end);
        setContent(newContent);
        
        requestAnimationFrame(() => {
            textarea.selectionStart = start;
            textarea.selectionEnd = start + modifiedText.length;
            textarea.focus();
        });
    };

    const bottomToolbarActions = [
        { icon: TrashIcon, label: 'Clear', action: () => setContent('') },
        { icon: CopyIcon, label: 'Copy', action: () => navigator.clipboard.writeText(content).then(() => addNotification({type:'success', title:'Copied'})) },
        { icon: ClipboardPasteIcon, label: 'Paste', action: () => navigator.clipboard.readText().then(t => handleAction(t)) },
        { icon: DocumentTextIcon, label: 'Bold', action: () => modifyText(t => `**${t}**`) },
        { icon: DocumentTextIcon, label: 'Italic', action: () => modifyText(t => `*${t}*`) },
        { icon: MinusIcon, label: 'Strike', action: () => modifyText(t => `~~${t}~~`) },
        { icon: Bars3Icon, label: 'List', action: () => modifyText(t => t.split('\n').map(l => `- ${l}`).join('\n')) },
        { icon: ChatBubbleLeftRightIcon, label: 'Quote', action: () => modifyText(t => t.split('\n').map(l => `> ${l}`).join('\n')) },
        { icon: CodeIcon, label: 'Code', action: () => modifyText(t => `\`${t}\``) },
        { icon: LinkIcon, label: 'Link', action: () => modifyText(t => `[${t}](url)`) },
        { icon: ClockIcon, label: 'Time', action: () => handleAction(new Date().toLocaleTimeString()) },
        { icon: WrenchScrewdriverIcon, label: 'JSON Fmt', action: () => { try { modifyText(t => JSON.stringify(JSON.parse(t), null, 2)) } catch(e) { addNotification({type:'error', title:'Invalid JSON'}) } } },
    ];
    
    const defaultTopActions = [
        { key: 'summarize', icon: SummarizeIcon, label: "تلخيص", prompt: "لخص ما سبق باختصار.", replace: true },
        { key: 'enhance', icon: SparklesIcon, label: "تحسين", prompt: "أعد صياغة النص التالي ليكون أكثر احترافية:\n", replace: false },
        { key: 'explain_code', icon: CodeIcon, label: "شرح كود", prompt: "اشرح الكود التالي بالتفصيل:\n", replace: false },
        { key: 'trans_en', icon: ArrowsRightLeftIcon, label: "ترجمة EN", prompt: "ترجم إلى الإنجليزية:\n", replace: false },
        { key: 'trans_ar', icon: ArrowsRightLeftIcon, label: "ترجمة AR", prompt: "ترجم إلى العربية:\n", replace: false },
        { key: 'ideas', icon: LightbulbIcon, label: "أفكار", prompt: "اقترح 5 أفكار إبداعية حول:\n", replace: false },
        { key: 'simplify', icon: BeakerIcon, label: "تبسيط", prompt: "اشرح لي هذا المفهوم وكأني طفل في الخامسة:\n", replace: false },
        { key: 'debug', icon: WrenchScrewdriverIcon, label: "Debug", prompt: "ساعدني في اكتشاف الخطأ هنا:\n", replace: false },
        { key: 'plan', icon: DocumentTextIcon, label: "خطة", prompt: "ضع خطة عمل لتنفيذ:\n", replace: false },
        { key: 'sql', icon: CommandLineIcon, label: "SQL", prompt: "اكتب استعلام SQL لـ:\n", replace: false },
        { key: 'react', icon: CodeIcon, label: "React", prompt: "أنشئ مكون React يقوم بـ:\n", replace: false },
        { key: 'entity', icon: CubeIcon, label: "Entity", prompt: "/extract-entities ", replace: false },
    ];

    const topActions = useMemo(() => {
        const customPrompts = settings?.customToolbarPrompts || {};
        return defaultTopActions.map(action => {
             const custom = customPrompts[action.key];
             if (custom) {
                 try {
                     const parsed = JSON.parse(custom);
                     return { ...action, label: parsed.label, prompt: parsed.prompt };
                 } catch (e) { return action; }
             }
             return action;
        });
    }, [settings]);

    const handleEditButton = (key: string, currentLabel: string, currentPrompt: string) => {
        setEditingButtonKey(key);
        setNewButtonLabel(currentLabel);
        setNewButtonPrompt(currentPrompt);
    };
    
    const handleContextMenu = (e: React.MouseEvent, key: string, label: string, prompt: string) => {
        e.preventDefault();
        handleEditButton(key, label, prompt);
    };

    const saveButtonConfig = () => {
        if (!editingButtonKey || !settings) return;
        const updatedCustomPrompts = {
            ...(settings.customToolbarPrompts || {}),
            [editingButtonKey]: JSON.stringify({ label: newButtonLabel, prompt: newButtonPrompt })
        };
        saveSettings({ ...settings, customToolbarPrompts: updatedCustomPrompts });
        setEditingButtonKey(null);
    };

    return (
        <div className="w-full bg-gray-950/95 backdrop-blur-xl border-t border-white/5 pb-safe z-40 relative shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 max-w-full overflow-hidden">
            
            <AnimatePresence>
                {editingButtonKey && (
                    <MotionDiv initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 10}} className="absolute bottom-full left-0 right-0 mx-auto w-full max-w-lg mb-4 p-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col gap-3">
                         <div className="flex justify-between items-center border-b border-white/10 pb-2">
                             <h3 className="font-bold text-white flex items-center gap-2"><EditIcon className="w-4 h-4 text-indigo-400"/> Customize Button</h3>
                             <button onClick={() => setEditingButtonKey(null)} className="p-1 hover:bg-white/10 rounded"><XIcon className="w-5 h-5 text-gray-400"/></button>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Label</label>
                            <input value={newButtonLabel} onChange={e => setNewButtonLabel(e.target.value)} placeholder="Button Label" className="w-full p-2 bg-gray-800 border border-white/5 rounded text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none mt-1"/>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Prompt Template</label>
                            <textarea value={newButtonPrompt} onChange={e => setNewButtonPrompt(e.target.value)} placeholder="Prompt Text..." className="w-full p-2 bg-gray-800 border border-white/5 rounded text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none mt-1 resize-none" rows={3}/>
                         </div>
                         <div className="flex justify-end gap-2 pt-1">
                             <button onClick={() => setEditingButtonKey(null)} className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-semibold text-gray-200">Cancel</button>
                             <button onClick={saveButtonConfig} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white">Save Changes</button>
                         </div>
                    </MotionDiv>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showToolbars && (
                    <MotionDiv 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-2 py-1 relative border-b border-white/5 bg-gray-900/50 w-full overflow-hidden"
                    >
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mask-linear-fade touch-pan-x">
                            {topActions.map((action, idx) => (
                                <ToolbarButton 
                                    key={action.key}
                                    icon={action.icon}
                                    label={action.label}
                                    onClick={() => handleAction(action.prompt, action.replace)}
                                    onContextMenu={(e) => handleContextMenu(e, action.key, action.label, action.prompt)}
                                    colorIndex={idx}
                                    isEditing={isEditMode}
                                    onEdit={() => handleEditButton(action.key, action.label, action.prompt)}
                                />
                            ))}
                             <div className="w-8 flex-shrink-0"></div>
                        </div>
                        <button 
                            onClick={() => setIsEditMode(!isEditMode)} 
                            className={`absolute right-0 top-0 bottom-0 px-3 bg-gradient-to-l from-gray-950 via-gray-950 to-transparent flex items-center justify-center z-10`}
                        >
                            <div className={`p-1.5 rounded-full ${isEditMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 border border-white/10'}`}>
                                <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                            </div>
                        </button>
                    </MotionDiv>
                )}
            </AnimatePresence>

            <div className="px-2 py-2 md:px-4 md:py-3 w-full max-w-full overflow-hidden">
                <div className="flex items-end gap-2 bg-gray-900/80 border border-white/10 p-1.5 md:p-2 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all min-h-[48px] min-w-0 max-w-full overflow-hidden">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                    
                     <button 
                        onClick={() => setShowToolbars(!showToolbars)} 
                        className={`p-2 rounded-xl flex-shrink-0 transition-colors h-[40px] w-[40px] flex items-center justify-center touch-manipulation ${showToolbars ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                    >
                        {showToolbars ? <ChevronDownIcon className="w-5 h-5"/> : <ChevronUpIcon className="w-5 h-5"/>}
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl h-[40px] w-[40px] flex justify-center items-center flex-shrink-0 transition-colors touch-manipulation">
                        <PaperclipIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative min-w-0 py-1 overflow-hidden">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-1.5 text-base md:text-sm leading-relaxed max-h-[160px] custom-scrollbar overflow-x-hidden"
                            rows={1}
                            dir="auto"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                         {attachment && (
                            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 bg-gray-800 text-xs text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/30 shadow-2xl z-20">
                                <PaperclipIcon className="w-3 h-3" />
                                <span className="max-w-[100px] truncate">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="p-0.5"><XIcon className="w-3.5 h-3.5 hover:text-red-400"/></button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleSend} 
                        disabled={(!content.trim() && !attachment) || isLoading} 
                        className={`p-2 rounded-xl h-[40px] w-[40px] flex justify-center items-center shadow-lg transition-all duration-200 flex-shrink-0 touch-manipulation ${
                            (!content.trim() && !attachment) || isLoading 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-90 shadow-indigo-900/40'
                        }`}
                    >
                        {isUploading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showToolbars && (
                     <MotionDiv 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-2 pb-2 w-full overflow-hidden"
                     >
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x">
                            {bottomToolbarActions.map((action, idx) => (
                                <ToolbarButton 
                                    key={idx}
                                    icon={action.icon}
                                    label={action.label}
                                    onClick={action.action}
                                    onContextMenu={(e) => e.preventDefault()}
                                    colorIndex={idx + 5}
                                />
                            ))}
                             <div className="w-8 flex-shrink-0"></div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatInput;
