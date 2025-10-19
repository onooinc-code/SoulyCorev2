"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useDataSourceSettings } from '@/lib/hooks/use-data-source-settings';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const GoogleDriveModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    const {
        config,
        setConfig,
        isSaving,
        handleSave,
        connectionStatus,
        handleTestConnection,
        isLoading,
    } = useDataSourceSettings(service, onSaveSuccess, {}, 'connect'); // Use 'connect' as the test action

    if (isLoading) {
        return <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101]"><p>Loading status...</p></div>;
    }
    
    const isConnected = connectionStatus === 'success';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-8">
                    {connectionStatus === 'testing' ? (
                         <div className="text-center"><h3 className="font-semibold text-lg text-white animate-pulse">Connecting...</h3><p className="text-sm text-gray-400 mt-2">Please complete authentication in the new window.</p></div>
                    ) : isConnected ? (
                        <div className="text-center">
                            <div className="flex justify-center mb-4"><div className="p-3 bg-green-500/20 rounded-full"><CheckIcon className="w-8 h-8 text-green-400"/></div></div>
                            <h3 className="font-semibold text-lg text-white">Successfully Connected</h3>
                            <p className="text-sm text-gray-400 mt-2">Connected as <span className="font-semibold text-gray-200">{config.email}</span>.</p>
                             <div className="mt-6 p-4 bg-gray-900/50 rounded-lg text-sm text-left">
                                <p><strong>Status:</strong> <span className="text-green-400">Active</span></p>
                                <p><strong>Permissions:</strong> Read-only access to files.</p>
                            </div>
                            <button onClick={async () => {
                                await handleTestConnection(config, 'disconnect');
                                handleSave();
                            }} className="w-full mt-6 px-6 py-2 bg-red-600/80 text-white rounded-lg font-semibold hover:bg-red-600">Disconnect</button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-white">Connect Your Google Drive</h3>
                            <p className="text-sm text-gray-400 mt-2 mb-6">Allow HedraCore to securely access your files for analysis and context.</p>
                            {connectionStatus === 'error' && <p className="text-sm text-red-400 mb-4">Connection failed. Please try again.</p>}
                            <button onClick={async () => {
                                await handleTestConnection(config);
                                handleSave(); 
                            }} className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">
                                <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#4285F4" d="M34.3,14.3l6.9,0l-14-14l-14,14l6.9,0l7.1-7.1L34.3,14.3z"/><path fill="#4CAF50" d="M14.3,33.7l-7.1,7.1l14,14l14-14l-7.1-7.1l-6.9,6.9L14.3,33.7z"/><path fill="#FFC107" d="M48,21v14l-14,14V35l14-14H48z M0,21v14l14,14V35L0,21z"/></svg>
                                <span>Connect to Google Drive</span>
                            </button>
                        </div>
                    )}
                </main>
                <footer className="flex justify-end p-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Close</button>
                </footer>
            </motion.div>
        </motion.div>
    );
};
