"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Contact, Prompt } from '@/lib/types';
import { SendIcon, PaperclipIcon } from '@/components/Icons';
import { useLog } from '@/components/providers/LogProvider';
import { usePrompts } from '@/lib/hooks/usePrompts';
import FillPromptVariablesModal from './FillPromptVariablesModal';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [mentionedContacts, setMentionedContacts] = useState<Contact[]>([]);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptToFill, setPromptToFill] = useState<Prompt | null>(null);
    const [promptVariables, setPromptVariables] = useState<string[]>([]);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { log } = useLog();
    const { prompts, fetchPrompts } = usePrompts();

    useEffect(() => {
        fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(adjustTextareaHeight, [content]);
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
        
        if (event.key === '/') {
            // Placeholder for slash command/prompt menu
            console.log("Slash command triggered");
        }
    };

    const handleSend = () => {
        if (content.trim() && !isLoading) {
            onSendMessage(content, mentionedContacts);
            setContent('');
            setMentionedContacts([]);
            log('User sent a message.', { contentLength: content.length });
        }
    };
    
    const handleUsePrompt = (prompt: Prompt) => {
        const variableRegex = /{{\s*(\w+)\s*}}/g;
        const matches = [...prompt.content.matchAll(variableRegex)];
        const variables = [...new Set(matches.map(match => match[1]))];

        if (variables.length > 0) {
            setPromptToFill(prompt);
            setPromptVariables(variables);
            setIsPromptModalOpen(true);
        } else {
            setContent(prev => `${prev}${prompt.content}`);
        }
    };
    
    const handlePromptVariablesSubmit = (values: Record<string, string>) => {
        if (!promptToFill) return;
        let finalContent = promptToFill.content;
        for (const [key, value] of Object.entries(values)) {
            finalContent = finalContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
        }
        setContent(prev => `${prev}${finalContent}`);
    };

    return (
        <div className="bg-gray-800 p-4 border-t border-white/10">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
                <button
                    className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    title="Attach file (coming soon)"
                    disabled
                >
                    <PaperclipIcon className="w-6 h-6" />
                </button>

                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message, or type '/' for prompts..."
                        className="w-full bg-gray-700 rounded-lg p-3 text-base resize-none overflow-y-auto max-h-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={1}
                        disabled={isLoading}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={isLoading || !content.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-full transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send message (Enter)"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
            
             <FillPromptVariablesModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                prompt={promptToFill}
                variables={promptVariables}
                onSubmit={handlePromptVariablesSubmit}
            />
        </div>
    );
};

export default ChatInput;
