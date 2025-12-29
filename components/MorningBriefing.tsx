
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// FIX: Corrected a relative import path for the `XIcon` component to use the absolute path alias `@/components/Icons`, resolving a module resolution error during the build process.
import { XIcon } from '@/components/Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MotionDiv = motion.div as any;

interface MorningBriefingProps {
    onClose: () => void;
}

const MorningBriefing = ({ onClose }: MorningBriefingProps) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBriefing = async () => {
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
                localStorage.setItem('lastVisit', new Date().toDateString());
            }
        };
        fetchBriefing();
    }, []);

    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <MotionDiv
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg shadow-xl w-11/12 md:max-w-2xl max-h-[90vh] flex flex-col border border-indigo-500/50"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 flex-shrink-0">
                    <h2 className="text-xl font-bold">Your Morning Briefing</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
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
                     <button onClick={onClose} className="w-full px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm">Continue</button>
                 </div>
            </MotionDiv>
        </MotionDiv>
    );
};

export default MorningBriefing;
