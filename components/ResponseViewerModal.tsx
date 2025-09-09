"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';

interface ResponseViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ResponseViewerModal = ({ isOpen, onClose }: ResponseViewerModalProps) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchLatestResponse = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch('/api/responses/latest');
                    const content = await res.text();
                    if (!res.ok) {
                        // Use the HTML error response from the server directly if available
                        setHtmlContent(content);
                        throw new Error(`Server responded with status ${res.status}`);
                    }
                    setHtmlContent(content);
                } catch (e) {
                    setError((e as Error).message);
                    if (!htmlContent) { // Only set generic error if we didn't get an HTML one
                        setHtmlContent('Failed to fetch the report.');
                    }
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLatestResponse();
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full h-full flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                            <h2 className="text-xl font-bold">Last Response Report</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                            {isLoading ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">Loading latest report...</div>
                            ) : (
                                <iframe
                                    srcDoc={htmlContent}
                                    title="Last Response Preview"
                                    className="w-full h-full bg-white rounded-md border-none"
                                    sandbox="allow-same-origin allow-scripts" // Allow scripts for mermaid.js
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ResponseViewerModal;
