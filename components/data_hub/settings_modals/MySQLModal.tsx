"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

export const MySQLModal = ({ service, onClose }: ModalProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="font-semibold">{service.name} Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-gray-400">Configure connection to a self-hosted MySQL database.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Host" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                        <input type="text" placeholder="Port (e.g., 3306)" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                    <input type="text" placeholder="Database Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    <input type="text" placeholder="Username" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    <input type="password" placeholder="Password" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                </main>
                <footer className="flex justify-end gap-2 p-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                    <button className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500">Save</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};
