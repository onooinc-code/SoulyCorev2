
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SendIcon, PaperclipIcon, XIcon, PromptsIcon } from './Icons';
import type { Contact, Prompt, Message } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useLog } from './providers/LogProvider';
import dynamic from 'next/dynamic';

const FillPromptVariablesModal = dynamic(() => import('@/components/FillPromptVariablesModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});


interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
    const { setStatus, startWorkflow } = useConversation();
    const { log } = useLog();
    const [content, setContent] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    
    // @mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionedContacts, setMentionedContacts] = useState<Contact[]>([]);

    // #tag suggestion state
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [tagQuery, setTagQuery] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState<Message[]>([]);
    const tagDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Prompts launcher state
    const [isPromptsListOpen, setIsPromptsListOpen] = useState(false);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [promptSearchTerm, setPromptSearchTerm] = useState('');
    const [pendingPrompt, setPendingPrompt] = useState<Prompt | null>(null);
    const [variableModalState, setVariableModalState] = useState<{
        isOpen: boolean;
        prompt: Prompt | null;
        variables: string[];
    }>({ isOpen: false, prompt: null, variables: [] });
    
    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const promptsListRef = useRef<HTMLDivElement>(null);

    // Data fetching
    const fetchContacts = useCallback(async () => {
        try {
            log('Fetching contacts for @mentions...');
            const res = await fetch('/api/contacts');
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const { contacts } = await res.json();
            setContacts(contacts);
        } catch (error) {
            setStatus({ error: 'Contacts for @mentions could not be loaded.' });
        }
    }, [setStatus, log]);
    
    const fetchPrompts = useCallback(async () => {
        if (prompts.length > 0 && isPromptsListOpen) return;
        try {
            log('Fetching prompts for launcher...');
            const res = await fetch('/api/prompts');
            if (!res.ok) throw new Error('Failed to fetch prompts');
            const data = await res.json();
            setPrompts(data);
            log(`Fetched ${data.length} prompts for launcher.`);
        } catch(error) {
             log('Failed to fetch prompts for launcher.', { error: { message: (error as Error).message } }, 'error');
        }
    }, [isPromptsListOpen, prompts.length, log]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (promptsListRef.current && !promptsListRef.current.contains(event.target as Node)) {
                setIsPromptsListOpen(false);
            }
        };
        if (isPromptsListOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPromptsListOpen]);

    const performTagSearch = useCallback(async (query: string) => {
        if (!query) {
            setTagSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`/api/messages/search-by-tag?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Tag search failed');
            const data = await res.json();
            setTagSuggestions(data);
        } catch (error) {
            log('Tag autocomplete search failed', { error }, 'error');
        }
    }, [log]);

    useEffect(() => {
        if (tagDebounceTimeout.current) clearTimeout(tagDebounceTimeout.current);
        if (tagQuery) {
            tagDebounceTimeout.current = setTimeout(() => performTagSearch(tagQuery), 300);
        } else {
            setTagSuggestions([]);
        }
    }, [tagQuery, performTagSearch]);
    
    const updateMentionedContacts = (text: string) => {
        const mentionRegex = /@(\w+)/g;
        const currentMentions = new Set(Array.from(text.matchAll(mentionRegex)).map(match => match[1].toLowerCase()));
        const newMentionedContacts = contacts.filter(c => currentMentions.has(c.name.toLowerCase()));
        setMentionedContacts(newMentionedContacts);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);
        updateMentionedContacts(value);
        
        const cursorPosition = e.target.selectionStart;
        const textUpToCursor = value.substring(0, cursorPosition);
        
        const mentionMatch = textUpToCursor.match(/@(\w*)$/);
        const tagMatch = textUpToCursor.match(/#(\w*)$/);

        if (mentionMatch) {
            setShowMentions(true);
            setMentionQuery(mentionMatch[1].toLowerCase());
            setShowTagSuggestions(false);
        } else if (tagMatch) {
            setShowTagSuggestions(true);
            setTagQuery(tagMatch[1].toLowerCase());
            setShowMentions(false);
        } else {
            setShowMentions(false);
            setShowTagSuggestions(false);
        }
    };
    
    const handleMentionSelect = (name: string) => {
        const cursorPosition = textareaRef.current?.selectionStart || content.length;
        const textUpToCursor = content.substring(0, cursorPosition);
        const newContent = textUpToCursor.replace(/@\w*$/, `@${name} `) + content.substring(cursorPosition);
        
        setContent(newContent);
        updateMentionedContacts(newContent);
        setShowMentions(false);
        textareaRef.current?.focus();
        log('User selected @mention', { contactName: name });
    };

    const handleTagSuggestionSelect = (messageContent: string) => {
        setContent(messageContent);
        setShowTagSuggestions(false);
        textareaRef.current?.focus();
        log('User selected a tag suggestion to reuse a prompt.');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => setImageDataUrl(loadEvent.target?.result as string);
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageDataUrl) return;
        let messageContent = imageDataUrl ? `![user image](${imageDataUrl})\n\n${content}` : content;
        onSendMessage(messageContent, mentionedContacts);
        setContent('');
        setImageDataUrl(null);
        setMentionedContacts([]);
        setShowMentions(false);
        setShowTagSuggestions(false);
    };

    const handlePromptSelect = (prompt: Prompt) => {
        setIsPromptsListOpen(false);
        setPromptSearchTerm('');
        setPendingPrompt(prompt);

        if (prompt.type === 'chain') {
            const userInputVariables = new Set<string>();
            prompt.chain_definition?.forEach(step => {
                for (const key in step.inputMapping) {
                    if (step.inputMapping[key].source === 'userInput') {
                        userInputVariables.add(key);
                    }
                }
            });
            if (userInputVariables.size > 0) {
                log('User selected a chained prompt with user inputs.', { promptName: prompt.name, variables: [...userInputVariables] });
                setVariableModalState({ isOpen: true, prompt, variables: [...userInputVariables] });
            } else {
                log('User selected a chained prompt with no user inputs.', { promptName: prompt.name });
                startWorkflow(prompt, {});
                setPendingPrompt(null);
            }
        } else { // 'single' prompt
            const variableRegex = /{{\s*(\w+)\s*}}/g;
            const matches = [...prompt.content.matchAll(variableRegex)];
            const uniqueVariables = [...new Set(matches.map(match => match[1]))];
            if (uniqueVariables.length > 0) {
                log('User selected a single prompt with variables.', { promptName: prompt.name, variables: uniqueVariables });
                setVariableModalState({ isOpen: true, prompt, variables: uniqueVariables });
            } else {
                log('User selected a simple prompt.', { promptName: prompt.name });
                setContent(prompt.content);
                setPendingPrompt(null);
            }
        }
        textareaRef.current?.focus();
    };
    
    const handleVariableModalSubmit = (values: Record<string, string>) => {
        if (!pendingPrompt) return;
        
        if (pendingPrompt.type === 'chain') {
            log('User submitted variables for a chained prompt.', { promptName: pendingPrompt.name });
            startWorkflow(pendingPrompt, values);
        } else { // single
            log('User submitted variables for a single prompt.', { promptName: pendingPrompt.name });
            let finalContent = pendingPrompt.content;
            for (const [key, value] of Object.entries(values)) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                finalContent = finalContent.replace(regex, value);
            }
            setContent(finalContent);
        }
        
        setVariableModalState({ isOpen: false, prompt: null, variables: [] });
        setPendingPrompt(null);
        textareaRef.current?.focus();
    };

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().startsWith(mentionQuery));
    const filteredPrompts = prompts.filter(p => 
        p.name.toLowerCase().includes(promptSearchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(promptSearchTerm.toLowerCase())
    );

    return (
        <>
        <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
             {showMentions && filteredContacts.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredContacts.map(contact => (
                        <button key={contact.id} onClick={() => handleMentionSelect(contact.name)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                            {contact.name} <span className="text-gray-500">- {contact.company || contact.email}</span>
                        </button>
                    ))}
                </div>
            )}
             {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    <div className="px-4 py-2 text-xs text-gray-400">Suggesting messages with matching tags...</div>
                    {tagSuggestions.map(msg => (
                        <button key={msg.id} onClick={() => handleTagSuggestionSelect(msg.content)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                            <p className="truncate">{msg.content}</p>
                            <div className="flex gap-1 mt-1">{msg.tags?.map(t => <span key={t} className="text-xs bg-gray-600 px-1.5 py-0.5 rounded-full">#{t}</span>)}</div>
                        </button>
                    ))}
                </div>
            )}
             {isPromptsListOpen && (
                <div ref={promptsListRef} className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 flex flex-col">
                    <input type="text" placeholder="Search prompts..." value={promptSearchTerm} onChange={e => setPromptSearchTerm(e.target.value)} className="sticky top-0 p-2 bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" autoFocus />
                    <ul className="flex-1 overflow-y-auto">
                        {filteredPrompts.length > 0 ? filteredPrompts.map(prompt => (
                            <li key={prompt.id}><button onClick={() => handlePromptSelect(prompt)} className={`w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 border-l-4 ${prompt.type === 'chain' ? 'border-indigo-500' : 'border-transparent'}`}><strong className="block font-semibold">{prompt.name}</strong><p className="text-xs text-gray-400 truncate">{prompt.content}</p></button></li>
                        )) : <li className="px-4 py-3 text-sm text-gray-500 text-center">No prompts found.</li>}
                    </ul>
                </div>
            )}
            {imageDataUrl && (
                <div className="relative w-20 h-20 mb-2"><img src={imageDataUrl} alt="Upload preview" className="w-full h-full object-cover rounded-md" /><button onClick={() => setImageDataUrl(null)} className="absolute -top-2 -right-2 bg-gray-600 rounded-full p-0.5 text-white hover:bg-gray-500 z-10" title="Remove attached image"><XIcon className="w-4 h-4" /></button></div>
            )}
            <form onSubmit={handleSubmit} className="flex items-start space-x-2">
                 <button type="button" onClick={() => { log('User toggled Prompts Launcher.'); const willBeOpen = !isPromptsListOpen; setIsPromptsListOpen(willBeOpen); if (willBeOpen) fetchPrompts(); }} className="p-3 rounded-xl text-gray-200 transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" disabled={isLoading} title="Use a saved prompt"><PromptsIcon className="w-5 h-5" /></button>
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl text-gray-200 transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" disabled={isLoading || !!imageDataUrl} title="Attach an image"><PaperclipIcon className="w-5 h-5" /></button>
                <div className="flex-1 relative">
                    <textarea ref={textareaRef} value={content} onChange={handleContentChange} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} placeholder="Type a message, or use '#' for tag suggestions..." className="w-full p-2 pr-24 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={1} disabled={isLoading}/>
                    {mentionedContacts.length > 0 && (<div className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500/50 text-indigo-200 text-xs px-2 py-1 rounded-full">Context: {mentionedContacts.map(c => c.name).join(', ')}</div>)}
                </div>
                 <button type="submit" className="p-3 bg-indigo-600/50 hover:bg-indigo-600/80 backdrop-blur-sm border border-indigo-400/30 rounded-xl text-white transition-all duration-200 hover:scale-110 disabled:bg-indigo-400/50 disabled:cursor-not-allowed" disabled={isLoading || (!content.trim() && !imageDataUrl)} title="Send message"><SendIcon className="w-5 h-5" /></button>
            </form>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <FillPromptVariablesModal isOpen={variableModalState.isOpen} onClose={() => setVariableModalState({ isOpen: false, prompt: null, variables: [] })} prompt={variableModalState.prompt} variables={variableModalState.variables} onSubmit={handleVariableModalSubmit}/>
        </>
    );
};

export default ChatInput;
