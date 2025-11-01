"use client";

import React, { useState } from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useNotification } from '@/lib/hooks/use-notifications';
import ExtractionResults from './ExtractionResults';

const AiContactExtractor = () => {
    const { conversations } = useConversation();
    const { addNotification } = useNotification();
    const [selectedConversationId, setSelectedConversationId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any | null>(null);

    const handleExtract = async () => {
        if (!selectedConversationId) {
            addNotification({ type: 'warning', title: 'Please select a conversation.' });
            return;
        }

        setIsLoading(true);
        setResults(null);
        addNotification({ type: 'info', title: 'Starting Extraction...', message: 'The AI is analyzing the conversation. This may take a moment.' });
        
        try {
            const res = await fetch(`/api/memory/extract-from-conversation/${selectedConversationId}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to extract memory from conversation.');
            }
            const data = await res.json();
            setResults(data);
            addNotification({ type: 'success', title: 'Extraction Complete', message: 'Review the extracted information below.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Extraction Failed', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                <select 
                    value={selectedConversationId}
                    onChange={(e) => setSelectedConversationId(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={isLoading}
                >
                    <option value="">-- Select a conversation to analyze --</option>
                    {conversations.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
                <button
                    onClick={handleExtract}
                    disabled={isLoading || !selectedConversationId}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Extracting...' : 'Extract Memory'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4">
                <ExtractionResults data={results} />
                 {isLoading && (
                    <div className="text-center p-8">
                        <p className="animate-pulse">Analyzing conversation with Gemini...</p>
                    </div>
                )}
                 {!isLoading && !results && (
                    <div className="text-center p-8 text-gray-500">
                        <p>Select a conversation and click "Extract Memory" to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiContactExtractor;