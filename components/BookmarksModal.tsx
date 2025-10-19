
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
// FIX: Corrected a relative import path for the `XIcon` component to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { XIcon } from '@/components/Icons';
// FIX: Corrected import path for type.
import type { Message } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppContext } from './providers/AppProvider';

interface BookmarksModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const BookmarksModal = ({ isOpen, setIsOpen }: BookmarksModalProps) => {
    const { setStatus, clearError } = useAppContext();
    const [bookmarks, setBookmarks] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookmarks = useCallback(async () => {
        setIsLoading(true);
        clearError();
        try {
            // FIX: Added cache: 'no-store' to ensure fresh data is always fetched.
            const res = await fetch('/api/bookmarks', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch bookmarks');
            const data = await res.json();
            setBookmarks(data);
        } catch (error) {
            setStatus({ error: 'Could not load bookmarks.' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [clearError, setStatus]);

    useEffect(() => {
        if (isOpen) {
            fetchBookmarks();
        }
    }, [isOpen, fetchBookmarks]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Bookmarked Messages</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {isLoading ? (
                        <p>Loading bookmarks...</p>
                    ) : bookmarks.length > 0 ? (
                        bookmarks.map(msg => (
                            <div key={msg.id} className="bg-gray-900/50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-2">{new Date(msg.createdAt).toLocaleString()}</p>
                                <div className="prose-custom">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 pt-8">You have no bookmarked messages.</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default BookmarksModal;