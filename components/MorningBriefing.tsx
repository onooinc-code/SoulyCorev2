
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// FIX: Removed React.FC to fix framer-motion type inference issue.
const MorningBriefing = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('lastVisit');

        if (lastVisit !== today) {
            const fetchBriefing = async () => {
                setIsOpen(true);
                try {
                    // In a real implementation, an API would fetch and summarize the last conversation
                    // const response = await fetch('/api/briefing');
                    // const data = await response.json();
                    // setSummary(data.summary);
                    
                    // Using a placeholder for demonstration
                    setTimeout(() => {
                        setSummary("Welcome back! In your last session, you were discussing the technical design for the new proactive suggestions feature. You approved the idea and were about to start outlining the component structure.");
                        setIsLoading(false);
                    }, 1200);

                } catch (error) {
                    console.error("Failed to fetch briefing", error);
                    setSummary("Could not load your morning briefing.");
                    setIsLoading(false);
                } finally {
                    localStorage.setItem('lastVisit', today);
                }
            };
            fetchBriefing();
        }
    }, []);

    if (!isOpen) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation resolves this TypeScript error.
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
                    onClick={() => setIsOpen(false)}
                >
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation resolves this TypeScript error.
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-11/12 md:max-w-2xl max-h-[90vh] flex flex-col border border-indigo-500/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 flex-shrink-0">
                            <h2 className="text-xl font-bold">Your Morning Briefing</h2>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="prose-custom px-6 pb-4 overflow-y-auto">
                            {isLoading ? (
                                <p>Preparing your daily summary...</p>
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                            )}
                        </div>
                         <div className="p-6 pt-4 mt-auto flex-shrink-0">
                             <button onClick={() => setIsOpen(false)} className="w-full px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm">Continue</button>
                         </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MorningBriefing;
