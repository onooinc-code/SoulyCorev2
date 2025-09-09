

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';
import { useAppContext } from './providers/AppProvider';
import { useLog } from './providers/LogProvider';

interface AddKnowledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddKnowledgeModal = ({ isOpen, onClose }: AddKnowledgeModalProps) => {
    const { setStatus } = useAppContext();
    const { log } = useLog();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsLoading(true);
        setStatus({ currentAction: "Adding knowledge..." });
        log('User submitted new knowledge snippet.', { contentLength: content.length });
        try {
            const res = await fetch('/api/knowledge/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to add knowledge.");
            }
            
            log('Knowledge snippet added successfully.');
            setContent('');
            onClose();

        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to add knowledge snippet.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
        } finally {
            setIsLoading(false);
            setStatus({ currentAction: "" });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Add Knowledge Snippet</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-2">
                                Add a piece of information to the AI's semantic memory. This should be a self-contained fact or concept.
                            </p>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="e.g., The project codenamed 'Odyssey' is scheduled to launch in Q4."
                                className="w-full p-2 bg-gray-700 rounded-lg text-sm resize-y"
                                rows={5}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm disabled:opacity-50">Cancel</button>
                            <button onClick={handleSubmit} disabled={isLoading || !content.trim()} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm disabled:opacity-50">
                                {isLoading ? 'Adding...' : 'Add to Memory'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddKnowledgeModal;
