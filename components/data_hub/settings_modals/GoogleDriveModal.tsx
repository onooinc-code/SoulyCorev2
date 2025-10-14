"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@/components/Icons';
import type { DataSource } from '@/lib/types';

export const GoogleDriveModal = ({ service, onClose }: { service: DataSource, onClose: () => void }) => {
    const [isConnected, setIsConnected] = useState(false);
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">Configure: {service.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 text-center">
                    <p className="text-sm text-gray-400">Connect your Google Drive account to allow SoulyCore to read and index your documents.</p>
                    
                    {isConnected ? (
                        <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg">
                            <p className="font-semibold text-green-300">Successfully connected!</p>
                            <p className="text-xs text-green-400">Account: user@gmail.com</p>
                        </div>
                    ) : (
                        <button onClick={() => setIsConnected(true)} className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-3">
                             <svg className="w-5 h-5" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                            Connect with Google
                        </button>
                    )}
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500">Done</button>
                </div>
            </motion.div>
        </motion.div>
    );
};
