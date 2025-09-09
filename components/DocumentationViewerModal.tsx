
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EditIcon, FullscreenIcon, ExitFullscreenIcon } from './Icons';
import { Documentation } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLog } from './providers/LogProvider';

interface DocumentationViewerModalProps {
    docKey: string;
    onClose: () => void;
}

const DocumentationViewerModal = ({ docKey, onClose }: DocumentationViewerModalProps) => {
    const [doc, setDoc] = useState<Documentation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { log } = useLog();

    const fetchDoc = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/documentation/${docKey}`);
            if (!res.ok) throw new Error("Failed to fetch document content.");
            const data = await res.json();
            setDoc(data);
            setEditedContent(data.content);
        } catch (error) {
            log('Failed to fetch document', { docKey, error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [docKey, log]);

    useEffect(() => {
        fetchDoc();
    }, [fetchDoc]);
    
    const handleSave = async () => {
        log('Saving documentation', { docKey });
        setIsLoading(true);
        try {
             const res = await fetch(`/api/documentation/${docKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editedContent }),
            });
            if (!res.ok) throw new Error("Failed to save document.");
            await fetchDoc(); // Refresh
            setIsEditing(false);
        } catch(error) {
            log('Failed to save document', { docKey, error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }

    const modalContent = (
        <>
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">{doc?.title || 'Documentation'}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 text-gray-400 hover:text-white">
                        {isFullscreen ? <ExitFullscreenIcon className="w-5 h-5"/> : <FullscreenIcon className="w-5 h-5"/>}
                    </button>
                     <button onClick={() => setIsEditing(!isEditing)} className="p-1 text-gray-400 hover:text-white" disabled={isLoading}>
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                {isLoading ? (
                    <p>Loading...</p>
                ) : isEditing ? (
                    <textarea 
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-full bg-gray-900/50 text-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                ) : (
                    <div className="prose-custom max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc?.content}</ReactMarkdown>
                    </div>
                )}
            </div>
            {isEditing && (
                 <div className="flex justify-end gap-2 p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 text-sm">Cancel</button>
                    <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-500 text-sm">{isLoading ? 'Saving...' : 'Save'}</button>
                </div>
            )}
        </>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed bg-black bg-opacity-70 flex items-center justify-center z-[60] ${isFullscreen ? 'inset-0 p-4' : 'inset-0'}`}
                onClick={!isFullscreen ? onClose : undefined}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-gray-800 rounded-lg shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-full max-h-[90vh]'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {modalContent}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DocumentationViewerModal;
