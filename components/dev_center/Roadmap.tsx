

"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Idea {
    id: string;
    text: string;
    status: 'new' | 'approved' | 'rejected';
    design?: string;
}

// FIX: Removed React.FC to allow for proper type inference with framer-motion props.
const Roadmap = () => {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDesigning, setIsDesigning] = useState<string | null>(null);

    const handleGenerateIdea = async () => {
        // This function needs to be refactored to call a new API endpoint.
        // For now, it's disabled.
    };

    const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
        setIdeas(ideas.map(idea => idea.id === id ? { ...idea, status } : idea));
    };

    const handleGenerateDesign = async (id: string) => {
        // This function needs to be refactored to call a new API endpoint.
        // For now, it's disabled.
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Roadmap & Ideas</h3>
                <button 
                    onClick={handleGenerateIdea} 
                    disabled={true} 
                    className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="This feature is disabled pending refactor for server-side architecture."
                >
                    {isLoading ? "Generating..." : "Generate New Idea"}
                </button>
            </div>
            
            <div className="space-y-4">
                {ideas.map(idea => (
                    <div key={idea.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="prose-custom">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{idea.text}</ReactMarkdown>
                        </div>
                        <div className="mt-4 pt-2 border-t border-gray-700 flex items-center gap-4">
                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${idea.status === 'new' ? 'bg-gray-600' : idea.status === 'approved' ? 'bg-green-600' : 'bg-red-600'}`}>{idea.status}</span>
                            {idea.status === 'new' && (
                                <>
                                    <button onClick={() => handleUpdateStatus(idea.id, 'approved')} className="text-sm text-green-400 hover:underline">Approve</button>
                                    <button onClick={() => handleUpdateStatus(idea.id, 'rejected')} className="text-sm text-red-400 hover:underline">Reject</button>
                                </>
                            )}
                        </div>
                        {idea.status === 'approved' && (
                             <div className="mt-4">
                                {!idea.design && (
                                    <button 
                                        onClick={() => handleGenerateDesign(idea.id)} 
                                        disabled={true} 
                                        className="text-sm px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="This feature is disabled pending refactor for server-side architecture."
                                    >
                                        {isDesigning === idea.id ? "Generating..." : "Generate Technical Design"}
                                    </button>
                                )}
                                {idea.design && (
                                    <div className="mt-2 p-3 bg-gray-900 rounded-md">
                                        <h4 className="font-bold mb-2">Technical Design:</h4>
                                        <div className="prose-custom">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{idea.design}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                 {!ideas.length && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Generate a new feature idea to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roadmap;