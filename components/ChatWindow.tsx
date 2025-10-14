

"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import Message from './Message';
import ChatInput from './ChatInput';
import type { Message as MessageType, Contact } from '@/lib/types';
import StatusBar from './StatusBar';
import ConversationSettingsModal from './ConversationSettingsModal';
import AgentConfigModal from './AgentConfigModal';
import SummaryModal from './SummaryModal';
import { motion } from 'framer-motion';
import { useLog } from './providers/LogProvider';
import Header from './Header'; // Import the new Header component
import dynamic from 'next/dynamic';
import LoadingIndicator from './LoadingIndicator';

const CognitiveInspectorModal = dynamic(() => import('./CognitiveInspectorModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Inspector...</p></div>
});

const HtmlViewerModal = dynamic(() => import('./HtmlViewerModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Viewer...</p></div>
});


const ChatWindow = () => {
    const { 
        currentConversation, 
        messages, 
        addMessage,
        toggleBookmark,
        isLoading,
        status,
        setStatus,
        clearError,
        deleteMessage,
        updateMessage,
        regenerateAiResponse,
        regenerateUserPromptAndGetResponse,
        backgroundTaskCount,
        activeWorkflow
    } = useConversation();
    const { log } = useLog();
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAgentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
    const [summaryModalState, setSummaryModalState] = useState<{isOpen: boolean, text: string, isLoading: boolean}>({isOpen: false, text: '', isLoading: false});
    const [inspectorModalState, setInspectorModalState] = useState<{ isOpen: boolean; messageId: string | null }>({ isOpen: false, messageId: null });
    const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
    const [htmlModalState, setHtmlModalState] = useState({ isOpen: false, content: '' });


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        // Clear suggestion when conversation changes
        setProactiveSuggestion(null);
    }, [currentConversation]);

    const handleSummarizeMessage = async (content: string) => {
        log('User requested message summary.');
        setSummaryModalState({ isOpen: true, text: '', isLoading: true });
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content }),
            });
            if (!res.ok) throw new Error('Failed to fetch summary from the server.');
            const data = await res.json();
            setSummaryModalState({ isOpen: true, text: data.summary, isLoading: false });
        } catch (error) {
            const errorText = 'Sorry, the summary could not be generated at this time.';
            log('Error fetching message summary.', { error: (error as Error).message }, 'error');
            setSummaryModalState({ isOpen: true, text: errorText, isLoading: false });
            setStatus({ error: (error as Error).message });
        }
    };

    const handleSendMessage = async (content: string, mentionedContacts: Contact[]) => {
        if (!content.trim()) return;
        
        const userMessage: Omit<MessageType, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'user',
            content,
            tokenCount: Math.ceil(content.length / 4),
        };

        const { aiResponse, suggestion } = await addMessage(userMessage, mentionedContacts);

        if (aiResponse) {
            setProactiveSuggestion(suggestion);
        }
    };

    const handleRegenerate = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
    
        if (message.role === 'model') {
            regenerateAiResponse(messageId);
        } else if (message.role === 'user') {
            regenerateUserPromptAndGetResponse(messageId);
        }
    };
    
    const handleSuggestionClick = () => {
        if (!proactiveSuggestion) return;
        log('User clicked proactive suggestion.', { suggestion: proactiveSuggestion });
        // This is a placeholder; a real implementation might pre-fill the input
        alert(`Action triggered: ${proactiveSuggestion}`);
        setProactiveSuggestion(null);
    };

    const handleViewHtml = (htmlContent: string) => {
        setHtmlModalState({ isOpen: true, content: htmlContent });
    };

    const isDbError = status.error && /database|vercel|table|relation.+does not exist/i.test(status.error);

    const lastMessageIds = useMemo(() => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
        return {
            user: lastUserMessage?.id,
            model: lastModelMessage?.id,
        };
    }, [messages]);

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-gray-900">
            <Header />
            <div className="flex flex-col flex-1 p-6 overflow-y-auto">
                {messages.length > 0 ? (
                    <div className="max-w-4xl mx-auto w-full mt-auto">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id}>
                                    <Message 
                                        message={msg}
                                        onSummarize={handleSummarizeMessage}
                                        onToggleBookmark={toggleBookmark}
                                        onDelete={() => deleteMessage(msg.id)}
                                        onUpdate={updateMessage}
                                        onRegenerate={() => handleRegenerate(msg.id)}
                                        onInspect={(messageId) => setInspectorModalState({ isOpen: true, messageId })}
                                        isContextAssemblyRunning={isLoading && msg.role === 'user' && msg.id === lastMessageIds.user && !activeWorkflow}
                                        isMemoryExtractionRunning={backgroundTaskCount > 0 && msg.role === 'model' && msg.id === lastMessageIds.model}
                                        onViewHtml={handleViewHtml}
                                        currentConversation={currentConversation}
                                    />
                                </div>
                            ))}
                            {isLoading && activeWorkflow && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center py-4 gap-4 text-sm text-gray-400"
                                >
                                    <LoadingIndicator />
                                    <span>Executing workflow step {activeWorkflow.currentStepIndex + 1} of {activeWorkflow.prompt.chain_definition?.length}...</span>
                                </motion.div>
                            )}
                             <div ref={messagesEndRef} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 m-auto">
                         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                            <svg className="w-16 h-16 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-200 mt-4">SoulyCore</h1>
                        <p className="mt-2 max-w-md">Your AI assistant with a persistent, intelligent memory. Start a new conversation to begin.</p>
                    </div>
                )}
            </div>

            {status.error && (
                <div className="p-4 bg-red-800/50 text-red-200 text-sm border-t border-red-700">
                    <div className="max-w-4xl mx-auto text-left">
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-base mb-2">An Error Occurred</p>
                            <button onClick={clearError} className="text-xs underline hover:text-white">Dismiss</button>
                        </div>
                        <p className="mb-4 bg-red-900/50 p-2 rounded-md font-mono">{status.error}</p>
                        
                        {isDbError && (
                             <div className="mt-4 p-4 bg-red-900/50 rounded-lg text-xs">
                                <p className="font-bold mb-2">How to Fix This Deployment Error:</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>
                                        <strong>Check Vercel Integration:</strong> Go to your project dashboard on Vercel, navigate to the "Storage" tab, and ensure your Postgres database is successfully connected to this project.
                                    </li>
                                    <li>
                                        <strong>Create Database Tables:</strong> In the Vercel "Storage" tab, click your database, then go to the "Query" tab. You must run the table creation script there. You can find the necessary SQL commands in the `scripts/create-tables.js` file in your project.
                                    </li>
                                    <li>
                                        <strong>Redeploy:</strong> After confirming the steps above, go to the "Deployments" tab for your project and redeploy the latest version to apply the changes.
                                    </li>
                                </ol>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {proactiveSuggestion && (
                 <motion.div 
                    initial={{ y: 50, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="p-3 bg-gray-800 border-t border-gray-700 flex justify-center items-center gap-4"
                >
                    <p className="text-sm text-indigo-300">{proactiveSuggestion}</p>
                    <button onClick={handleSuggestionClick} className="px-3 py-1 text-sm bg-indigo-600 rounded-md hover:bg-indigo-500">Yes</button>
                    <button onClick={() => {
                        log('User dismissed proactive suggestion.', { suggestion: proactiveSuggestion });
                        setProactiveSuggestion(null);
                    }} className="text-xs text-gray-400 hover:underline">Dismiss</button>
                 </motion.div>
            )}

            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            <StatusBar 
                onSettingsClick={() => {
                    log('User opened Conversation Settings Modal.');
                    setSettingsModalOpen(true);
                }}
                onAgentConfigClick={() => {
                    log('User opened Agent Config Modal.');
                    setAgentConfigModalOpen(true);
                }}
            />
            <ConversationSettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
            <AgentConfigModal 
                isOpen={isAgentConfigModalOpen} 
                onClose={() => setAgentConfigModalOpen(false)} 
                conversation={currentConversation}
            />
            <SummaryModal 
                isOpen={summaryModalState.isOpen}
                onClose={() => setSummaryModalState({isOpen: false, text: '', isLoading: false})}
                summaryText={summaryModalState.text}
                isLoading={summaryModalState.isLoading}
            />
            <CognitiveInspectorModal 
                isOpen={inspectorModalState.isOpen}
                onClose={() => setInspectorModalState({ isOpen: false, messageId: null })}
                messageId={inspectorModalState.messageId}
            />
            <HtmlViewerModal 
                isOpen={htmlModalState.isOpen}
                onClose={() => setHtmlModalState({ isOpen: false, content: '' })}
                htmlContent={htmlModalState.content}
            />
        </div>
    );
};

export default ChatWindow;