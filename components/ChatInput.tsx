"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, PaperclipIcon, PromptsIcon } from './Icons';
// FIX: Corrected import path for types.
import type { Contact, Prompt } from '@/lib/types';
import { useLog } from './providers/LogProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrompts } from '@/lib/hooks/usePrompts';
import FillPromptVariablesModal from './FillPromptVariablesModal';
import { useConversation } from './providers/ConversationProvider';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const [mentionedContacts, setMentionedContacts] = useState<Contact[]>([]);
    const [isPromptLauncherOpen, setIsPromptLauncherOpen] = useState(false);
    const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [promptVariables, setPromptVariables] = useState<string[]>([]);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const { log } = useLog();
    const { startWorkflow } = useConversation();
    
    // Using a dedicated hook for prompts logic
    const { prompts, isLoading: isLoadingPrompts } = usePrompts();
    
    const adjustTextareaHeight = () => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    };

    useEffect(adjustTextareaHeight, [inputValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && inputValue.trim()) {
                onSendMessage(inputValue, mentionedContacts);
                setInputValue('');
                setMentionedContacts([]);
            }
        }
    };
    
    const handlePromptSelect = (prompt: Prompt) => {
        setIsPromptLauncherOpen(false);
        const variableRegex = /{{\s*(\w+)\s*}}/g;
        const matches = [...prompt.content.matchAll(variableRegex)];
        const variables = [...new Set(matches.map(match => match[1]))];
        
        if (prompt.type === 'chain') {
            const userInputs = (prompt.chain_definition || []).flatMap(step => 
                Object.entries(step.inputMapping).filter(([, mapping]) => (mapping as any).source === 'userInput').map(([varName]) => varName)
            );
            const uniqueUserInputs = [...new Set(userInputs)];
             if (uniqueUserInputs.length > 0) {
                setSelectedPrompt(prompt);
                setPromptVariables(uniqueUserInputs);
                setIsVariablesModalOpen(true);
            } else {
                startWorkflow(prompt, {});
            }

        } else if (variables.length > 0) {
            setSelectedPrompt(prompt);
            setPromptVariables(variables);
            setIsVariablesModalOpen(true);
        } else {
            setInputValue(prompt.content);
            textAreaRef.current?.focus();
        }
    };
    
    const handleVariableSubmit = (values: Record<string, string>) => {
        if (!selectedPrompt) return;
        
        if (selectedPrompt.type === 'chain') {
            startWorkflow(selectedPrompt, values);
        } else {
            let finalContent = selectedPrompt.content;
            for (const [key, value] of Object.entries(values)) {
                finalContent = finalContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
            }
            setInputValue(finalContent);
        }
        setIsVariablesModalOpen(false);
        setSelectedPrompt(null);
    };

    return (
        <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
                <div className="relative">
                    <button onClick={() => setIsPromptLauncherOpen(p => !p)} className="p-2 text-gray-400 hover:text-white" title="Use a Prompt">
                        <PromptsIcon className="w-6 h-6"/>
                    </button>
                    <AnimatePresence>
                    {isPromptLauncherOpen && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-full mb-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-2 text-sm font-semibold border-b border-gray-700">Prompts</div>
                            <div className="max-h-60 overflow-y-auto">
                                {isLoadingPrompts ? <div className="p-4 text-center text-xs">Loading...</div> : prompts.map(p => (
                                    <button key={p.id} onClick={() => handlePromptSelect(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800">{p.name}</button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <button className="p-2 text-gray-400 hover:text-white" title="Attach file (coming soon)" disabled>
                    <PaperclipIcon className="w-6 h-6"/>
                </button>

                <textarea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 rounded-lg p-3 resize-none max-h-40 overflow-y-auto text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={1}
                    disabled={isLoading}
                />
                
                <button
                    onClick={() => onSendMessage(inputValue, mentionedContacts)}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-6 h-6"/>
                </button>
            </div>
             {selectedPrompt && (
                <FillPromptVariablesModal 
                    isOpen={isVariablesModalOpen}
                    onClose={() => setIsVariablesModalOpen(false)}
                    prompt={selectedPrompt}
                    variables={promptVariables}
                    onSubmit={handleVariableSubmit}
                />
            )}
        </div>
    );
};

export default ChatInput;