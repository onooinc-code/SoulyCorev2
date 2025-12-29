
"use client";

import React from 'react';
import { motion } from 'framer-motion';
// FIX: Corrected a relative import path for the `XIcon` component to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { XIcon } from '@/components/Icons';

const MotionDiv = motion.div as any;

interface ShortcutsModalProps {
    onClose: () => void;
}

const shortcuts = [
    { key: 'Cmd/Ctrl + K', description: 'Open Command Palette' },
    { key: 'Cmd/Ctrl + N', description: 'Create a new chat' },
    { key: 'Cmd/Ctrl + M', description: 'Open Memory Center' },
    { key: 'F11', description: 'Toggle Fullscreen Mode' },
    { key: 'Enter', description: 'Send message (in chat input)' },
    { key: 'Shift + Enter', description: 'Add a new line (in chat input)' },
    { key: 'Escape', description: 'Close modals or context menu' },
];

const ShortcutsModal = ({ onClose }: ShortcutsModalProps) => {
    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <MotionDiv
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-3">
                    {shortcuts.map(shortcut => (
                        <div key={shortcut.key} className="flex justify-between items-center text-sm">
                            <p className="text-gray-300">{shortcut.description}</p>
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-700 border border-gray-600 rounded-md">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </MotionDiv>
        </MotionDiv>
    );
};

export default ShortcutsModal;
