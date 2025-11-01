
"use client";

import React, { useState } from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';
import ExtractionResults from './ExtractionResults';
import { ClipboardPasteIcon } from '@/components/Icons';

const ContactContactExtractor = () => {
    const [chatText, setChatText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const { addNotification } = useNotification();

    const handleExtract = async () => {
        if (!chatText.trim()) {
            addNotification({ type: 'warning', title: 'Please paste some text.' });
            return;
        }

        setIsLoading(true);
        setResults(null);
        addNotification({ type: 'info', title: 'Starting Analysis...', message: 'The AI is analyzing the chat log. This may take a moment.' });
        
        try {
            const res = await fetch(`/api/memory/extract-from-chat-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: chatText }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to extract memory from chat text.');
            }
            const data = await res.json();
            setResults(data);
            addNotification({ type: 'success', title: 'Analysis Complete', message: 'Review the extracted information below.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Analysis Failed', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex-shrink-0 flex flex-col items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                <textarea 
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={`Paste chat log here. For best results, format each line like this:\nJohn: Hello, how are you?\nSarah: I'm doing well, thanks!`}
                    className="w-full h-40 p-2 bg-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                    disabled={isLoading}
                />
                <button
                    onClick={handleExtract}
                    disabled={isLoading || !chatText.trim()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <ClipboardPasteIcon className="w-5 h-5" />
                    {isLoading ? 'Analyzing...' : 'Analyze Chat Text'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4">
                <ExtractionResults data={results} />
                 {isLoading && (
                    <div className="text-center p-8">
                        <p className="animate-pulse">Analyzing chat with Gemini...</p>
                    </div>
                )}
                 {!isLoading && !results && (
                    <div className="text-center p-8 text-gray-500">
                        <p>Paste a chat log and click "Analyze" to extract entities, knowledge, and relationships.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactContactExtractor;
