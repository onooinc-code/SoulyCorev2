"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Contact, Prompt } from '@/lib/types';
import { SendIcon, PaperclipIcon, XIcon } from '@/components/Icons';
import { usePrompts } from '@/lib/hooks/usePrompts';
import FillPromptVariablesModal from './FillPromptVariablesModal';
import { useConversation } from './providers/ConversationProvider';
import { useUIState } from './providers/UIStateProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';


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
    const [isUploading, setIsUploading] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { prompts, fetchPrompts } = usePrompts();
    const { startAgentRun, startWorkflow, currentConversation } = useConversation();
    const { setActiveView } = useUIState();
    const { addNotification } = useNotification();


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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const allowedTypes = ['text/plain', 'text/markdown'];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const isAllowed = allowedTypes.includes(file.type) || (fileExtension === 'md');

            if (!isAllowed) {
                addNotification({ type: 'error', title: 'Invalid File Type', message: 'Please upload a .txt or .md file.' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                 addNotification({ type: 'error', title: 'File Too Large', message: 'File size cannot exceed 5MB.' });
                return;
            }
            setAttachment(file);
        }
        if(event.target) {
            event.target.value = '';
        }
    };
    
    const handleSend = async () => {
        if ((!content.trim() && !attachment) || isLoading || isUploading) return;

        // Handle slash commands first
        if (content.startsWith('/')) {
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
                    const workflow = prompts.find(p => p.type === 'chain' && p.name.toLowerCase() === workflowName.toLowerCase());
                    if (workflow) {
                        startWorkflow(workflow, {});
                        setContent('');
                    } else {
                        addNotification({type: 'error', title: 'Workflow Not Found', message: `Workflow "${workflowName}" could not be found.`});
                    }
                }
                return;
            }
        }

        let finalContent = content.trim();

        if (attachment) {
            setIsUploading(true);
            try {
                const response = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: {
                        'content-type': attachment.type,
                        'x-vercel-filename': attachment.name,
                    },
                    body: attachment,
                });
                const newBlob = await response.json();
                if (!response.ok) {
                    throw new Error(newBlob.error || 'Upload failed');
                }
                finalContent += `\n\n(Attached file: [${attachment.name}](${newBlob.url}))`;
            } catch (error) {
                const errorMessage = (error as Error).message;
                addNotification({type: 'error', title: 'Upload Failed', message: errorMessage});
                finalContent += `\n\n(Attachment "${attachment.name}" failed to upload.)`;
            } finally {
                setIsUploading(false);
            }
        }
        
        if (finalContent) {
            onSendMessage(finalContent, mentionedContacts);
        }

        setContent('');
        setAttachment(null);
        setMentionedContacts([]);
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
            <div className="max-w-4xl mx-auto">
                <AnimatePresence>
                    {attachment && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex items-center justify-between bg-gray-700 rounded-md px-3 py-2 text-sm mb-2"
                        >
                            <span className="truncate">Attached: {attachment.name}</span>
                            <button onClick={() => setAttachment(null)} className="p-1 rounded-full hover:bg-gray-600">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex items-end gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".txt,.md,text/plain,text/markdown"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                        title="Attach file (.txt, .md)"
                        disabled={isLoading || isUploading}
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
                            disabled={isLoading || isUploading}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isLoading || isUploading || (!content.trim() && !attachment)}
                        className="p-3 bg-indigo-600 text-white rounded-full transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-[48px] h-[48px]"
                        title="Send message (Enter)"
                    >
                        {isUploading ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <SendIcon className="w-6 h-6" />
                        )}
                    </button>
                </div>
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