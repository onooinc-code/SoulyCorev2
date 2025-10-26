"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XIcon } from './Icons';

interface HtmlViewerModalProps {
    onClose: () => void;
    htmlContent: string;
}

const HtmlViewerModal = ({ onClose, htmlContent }: HtmlViewerModalProps) => {
    return (
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
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">HTML Preview</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden">
                    <iframe
                        srcDoc={htmlContent}
                        title="HTML Preview"
                        className="w-full h-full bg-white rounded-md border-none"
                        sandbox="allow-same-origin" // Restrictive sandbox for security
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default HtmlViewerModal;