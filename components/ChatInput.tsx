"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Contact, Prompt } from '@/lib/types';
import { SendIcon, PaperclipIcon } from '@/components/Icons';
import { useLog } from '@/components/providers/LogProvider';
import { usePrompts } from '@/lib/hooks/usePrompts';
import FillPromptVariablesModal from './FillPromptVariablesModal';
import { useConversation } from './providers/ConversationProvider';
import { useUIState } from './providers/UIStateProvider';
import { AnimatePresence } from 'framer-motion';

interface ChatInputProps {
    onSendMessage: (content: string, mentionedContacts: Contact[]) => void;
    isLoading: boolean;
    replyToMessage: import('@/lib/types').Message | null;
}

const ChatInput = ({ onSendMessage, isLoading, replyToMessage }: ChatInputProps) => {
    const [content, setContent] = useState('');
    const [mentionedContacts, setMentionedContacts] = useState<Contact[]>([]);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptToFill, setPromptToFill] = useState<Prompt | null>(null);
    const [promptVariables, setPromptVariables] = useState<string[]>([]);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { log } = useLog();
    const { prompts, fetchPrompts } = usePrompts();
    const { startAgentRun, startWorkflow, currentConversation } = useConversation();
    const { setActiveView } = useUIState();


    useEffect(() => {
        if(currentConversation) fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentConversation]);

    // Focus textarea when replying
    useEffect(() => {
        if (replyToMessage) {
            textareaRef.current?.focus();
        }
    }, [replyToMessage]);


    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 200; // 5 lines * 24px line-height approx
            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    };

    useEffect(adjustTextareaHeight, [content]);
    
    const handleSend = () => {
        if (content.trim() && !isLoading) {
            
            // Check for slash commands
            if (content.startsWith('/agent')) {
                const goal = content.replace('/agent', '').trim();
                if(goal) {
                    startAgentRun(goal);
                    setContent('');
                    setActiveView('agent_center');
                }
                return;
            }
            
            if (content.startsWith('/workflow')) {
                const workflowName = content.replace('/workflow', '').trim();
                 if(workflowName) {
                    // This is a simplified implementation. A real one would use a fuzzy search
                    // and potentially a modal to select the workflow if ambiguous.
                    const workflow = prompts.find(p => p.type === 'chain' && p.name.toLowerCase() === workflowName.toLowerCase());
                    if (workflow) {
                        // For now, assuming no user inputs are needed for this simple case.
                        startWorkflow(workflow, {});
                        setContent('');
                    } else {
                        // Handle workflow not found
                        alert(`Workflow "${workflowName}" not found.`);
                    }
                }
                return;
            }

            onSendMessage(content, mentionedContacts);
            setContent('');
            setMentionedContacts([]);
            log('User sent a message.', { contentLength: content.length });
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
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
                        placeholder="Type your message, or type '/' for commands..."
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
            
            <AnimatePresence>
                {isPromptModalOpen && (
                    <FillPromptVariablesModal
                        onClose={() => setIsPromptModalOpen(false)}
                        prompt={promptToFill}
                        variables={promptVariables}
                        onSubmit={handlePromptVariablesSubmit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatInput;