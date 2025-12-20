
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Contact } from '@/lib/types';
import { 
    SendIcon, PaperclipIcon, XIcon, SparklesIcon, CodeIcon, 
    SummarizeIcon, BeakerIcon, ArrowsRightLeftIcon, LightbulbIcon,
    DocumentTextIcon, WrenchScrewdriverIcon, CommandLineIcon,
    LinkIcon, CubeIcon, BookmarkIcon, ClipboardPasteIcon, CopyIcon, TrashIcon, CheckIcon, EditIcon,
    ScissorsIcon, ClockIcon, MinusIcon, Bars3Icon, ChatBubbleLeftRightIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

// Color palette for diversified buttons
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
    <div className={`relative group w-full ${className || ''}`}>
        <button 
            onClick={onClick} 
            onContextMenu={onContextMenu}
            className="flex items-center justify-center w-full h-9 rounded-lg bg-gray-800/40 hover:bg-gray-800 border border-transparent hover:border-indigo-500/30 transition-all duration-200 relative"
            title={label}
        >
            <Icon className={`w-4 h-4 transition-colors ${COLORS[colorIndex % COLORS.length]}`} />
        </button>
        {isEditing && onEdit && (
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="absolute -top-1 -right-1 bg-gray-900 text-gray-300 rounded-full p-0.5 border border-gray-600 hover:text-white hover:bg-indigo-600 shadow-md z-10"
            >
                <EditIcon className="w-2 h-2" />
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

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();
    const { startAgentRun } = useConversation();

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            // Increase max height to accommodate larger default size
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 80), 300)}px`;
        }
    }, [content]);
    
    useEffect(() => {
        if (replyToMessage) textareaRef.current?.focus();
    }, [replyToMessage]);

    // --- Core Handlers ---
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

    // --- Bottom Toolbar Text Manipulation Logic ---
    const modifyText = (modifier: (text: string) => string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        if (!selectedText) {
             // If no text selected, apply to whole content or just warn
             // For now, let's apply to whole content for simple actions
             const modified = modifier(content);
             setContent(modified);
             return;
        }

        const modifiedText = modifier(selectedText);
        const newContent = content.substring(0, start) + modifiedText + content.substring(end);
        setContent(newContent);
        
        // Restore cursor/selection
        requestAnimationFrame(() => {
            textarea.selectionStart = start;
            textarea.selectionEnd = start + modifiedText.length;
            textarea.focus();
        });
    };

    // Exactly 12 items for symmetry
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
    
    // --- Top Toolbar Configuration ---
    // Reduced to exactly 12 items to match bottom toolbar for perfect alignment
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
                 } catch (e) {
                     return action;
                 }
             }
             return action;
        });
    }, [settings]);

    const handleEditButton = (key: string, currentLabel: string, currentPrompt: string) => {
        setEditingButtonKey(key);
        setNewButtonLabel(currentLabel);
        setNewButtonPrompt(currentPrompt);
    };
    
    // Triggered by Right Click
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
        <div className="w-full bg-gray-950/90 backdrop-blur-xl border-t border-white/5 pb-2 pt-2 z-40 relative shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            
            {/* Edit Mode Modal */}
            <AnimatePresence>
                {editingButtonKey && (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 10}} className="absolute bottom-full left-0 right-0 mx-auto w-full max-w-lg mb-4 p-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col gap-3">
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. Top Toolbar (Prompt Macros) - Exact 12 items, distributed */}
            <div className="px-3 pb-1 pt-1 relative">
                <div className="flex items-center justify-between gap-1 w-full">
                    {topActions.map((action, idx) => (
                        <div key={action.key} className="flex-1">
                            <ToolbarButton 
                                icon={action.icon}
                                label={action.label}
                                onClick={() => handleAction(action.prompt, action.replace)}
                                onContextMenu={(e) => handleContextMenu(e, action.key, action.label, action.prompt)}
                                colorIndex={idx}
                                isEditing={isEditMode}
                                onEdit={() => handleEditButton(action.key, action.label, action.prompt)}
                            />
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className={`absolute -right-1 -top-1 p-1 rounded-full shadow-lg scale-75 ${isEditMode ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    title="Configure Toolbar"
                >
                    <WrenchScrewdriverIcon className="w-3 h-3" />
                </button>
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

            {/* 3. Input Area - Height Increased */}
            <div className="px-4 pb-3">
                <div className="flex items-end gap-2 bg-gray-900 border border-white/10 p-3 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all min-h-[80px]">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                    
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl h-[44px] w-[44px] flex justify-center items-center flex-shrink-0 transition-colors mb-1" title="Attach File">
                        <PaperclipIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative h-full">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleInputChange}
                            placeholder="اكتب رسالتك، استخدم / للأوامر، @ للإشارة..."
                            className="w-full bg-transparent border-0 focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-2 text-base leading-relaxed min-h-[60px] max-h-[300px]"
                            rows={3}
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
                        className={`p-3 rounded-xl h-[44px] w-[44px] flex justify-center items-center shadow-lg transition-all duration-200 flex-shrink-0 mb-1 ${
                            (!content.trim() && !attachment) || isLoading 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isUploading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* 4. Bottom Toolbar (Text Manipulation) - Justified & Flexible - 12 items */}
            <div className="px-3 pb-2">
                <div className="flex items-center justify-between gap-1 w-full">
                    {bottomToolbarActions.map((action, idx) => (
                        <div key={idx} className="flex-1">
                             <ToolbarButton 
                                icon={action.icon}
                                label={action.label}
                                onClick={action.action}
                                onContextMenu={(e) => e.preventDefault()}
                                colorIndex={idx + 5}
                            />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ChatInput;
