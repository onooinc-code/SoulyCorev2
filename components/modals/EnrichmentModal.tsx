"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XIcon, SparklesIcon } from '../Icons';

interface EnrichmentModalProps {
    currentDescription: string;
    enrichedDescription: string;
    onClose: () => void;
    onSave: (newDescription: string) => void;
}

const EnrichmentModal = ({ currentDescription, enrichedDescription, onClose, onSave }: EnrichmentModalProps) => {

    const handleReplace = () => {
        onSave(enrichedDescription);
        onClose();
    };

    const handleAppend = () => {
        const newDescription = `${currentDescription}\n\n${enrichedDescription}`;
        onSave(newDescription);
        onClose();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-blue-400" />
                        AI Description Enrichment
                    </h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                    <div>
                        <h3 className="font-semibold mb-2">Current Description</h3>
                        <div className="p-3 bg-gray-700/50 rounded-md text-sm whitespace-pre-wrap h-full">
                            {currentDescription || <i className="text-gray-500">No current description.</i>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">AI-Suggested Enrichment</h3>
                        <div className="p-3 bg-indigo-900/30 rounded-md text-sm whitespace-pre-wrap h-full">
                            {enrichedDescription}
                        </div>
                    </div>
                </main>
                <footer className="flex justify-end gap-3 p-4 bg-gray-900/50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={handleAppend} className="px-4 py-2 text-sm bg-blue-600 rounded-md">Append</button>
                    <button onClick={handleReplace} className="px-4 py-2 text-sm bg-green-600 rounded-md">Replace</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default EnrichmentModal;
