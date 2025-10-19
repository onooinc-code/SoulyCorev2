"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const GraphDBModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-6">
                    <div className="text-center text-gray-400">
                        <p>This settings panel is a placeholder.</p>
                        <p className="text-xs mt-2">Implementation for Vercel GraphDB will be available in a future update.</p>
                    </div>
                </main>
                 <footer className="flex justify-end gap-2 p-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Close</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};
