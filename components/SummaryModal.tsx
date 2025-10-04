



"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summaryText: string;
    isLoading: boolean;
}

// FIX: Removed React.FC to fix framer-motion type inference issue.
const SummaryModal = ({ isOpen, onClose, summaryText, isLoading }: SummaryModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation resolves this TypeScript error.
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation resolves this TypeScript error.
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Message Summary</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="prose-custom max-h-80 overflow-y-auto">
                            {isLoading ? (
                                <p>Generating summary...</p>
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SummaryModal;
