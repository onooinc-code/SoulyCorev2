
"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';
interface ConnectionLog {
    timestamp: Date;
    status: 'success' | 'error';
    message: string;
}

export const VercelKVModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [readOnlyToken, setReadOnlyToken] = useState('');

    const [isTokenVisible, setIsTokenVisible] = useState(false);
    const [isReadOnlyTokenVisible, setIsReadOnlyTokenVisible] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);

    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);

    const handleTestConnection = useCallback(async () => {
        setConnectionStatus('testing');
        log('Testing Vercel KV connection...');
        const newLogEntry: ConnectionLog = {
            timestamp: new Date(),
            status: 'error', // Default to error
            message: 'Connection failed. Please check credentials and URL.',
        };

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        
        // Simple validation simulation
        const success = url.includes('vercel.app') && token.length > 20;
        
        if (success) {
            newLogEntry.status = 'success';
            newLogEntry.message = 'Connection successful.';
        }

        setConnectionStatus(newLogEntry.status);
        setConnectionLogs(prev => [newLogEntry, ...prev]);
        log(`Vercel KV connection test result: ${newLogEntry.status}`);

    }, [url, token, log]);

    const handleSave = async () => {
        setIsSaving(true);
        log('Saving Vercel KV settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsModified(false);
        onClose();
    };

    const statusIndicatorClasses: Record<ConnectionStatus, string> = {
        idle: 'bg-gray-500',
        testing: 'bg-yellow-400 animate-pulse',
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                    <h2 className="font-semibold text-lg">{service.name} Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-300">KV_REST_API_URL</label>
                        <p className="text-xs text-gray-500 mb-2">Found in your Vercel project's storage dashboard.</p>
                        <input type="text" value={url} onChange={e => { setUrl(e.target.value); setIsModified(true); }} placeholder="https://<region>-<project>-<id>.kv.vercel-storage.com" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">REST API Token (Read/Write)</label>
                         <p className="text-xs text-gray-500 mb-2">This token will be stored securely.</p>
                        <div className="relative">
                            <input type={isTokenVisible ? 'text' : 'password'} value={token} onChange={e => { setToken(e.target.value); setIsModified(true); }} placeholder="Your Read/Write Token" className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm" />
                            <button onClick={() => setIsTokenVisible(!isTokenVisible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {isTokenVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">REST API Read-Only Token (Optional)</label>
                         <p className="text-xs text-gray-500 mb-2">Used for read-only operations to enhance security.</p>
                        <div className="relative">
                            <input type={isReadOnlyTokenVisible ? 'text' : 'password'} value={readOnlyToken} onChange={e => { setReadOnlyToken(e.target.value); setIsModified(true); }} placeholder="Your Read-Only Token" className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm" />
                            <button onClick={() => setIsReadOnlyTokenVisible(!isReadOnlyTokenVisible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {isReadOnlyTokenVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                     <div className="border-t border-gray-700/50 pt-4">
                         <h4 className="text-sm font-medium text-gray-300 mb-2">Connection Logs</h4>
                         <div className="bg-gray-900 rounded-lg p-2 h-24 overflow-y-auto text-xs font-mono">
                            {connectionLogs.length === 0 ? (
                                <p className="text-gray-500 text-center pt-4">No connection attempts yet.</p>
                            ) : (
                                connectionLogs.map((log, index) => (
                                    <p key={index} className={`flex items-center gap-2 ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                        {log.status === 'success' ? <CheckIcon className="w-4 h-4"/> : <XIcon className="w-4 h-4"/>}
                                        <span>[{log.timestamp.toLocaleTimeString()}]</span>
                                        <span>-</span>
                                        <span>{log.message}</span>
                                    </p>
                                ))
                            )}
                         </div>
                     </div>

                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                         <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
                        <button onClick={handleTestConnection} disabled={connectionStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">
                            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !isModified} className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500 disabled:opacity-50">
                             {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};
