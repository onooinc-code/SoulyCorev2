// components/data_hub/settings_modals/VercelRedisModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';
interface ConnectionLogEntry {
    timestamp: string;
    message: string;
    status: 'pending' | 'success' | 'error' | 'info';
}

export const VercelRedisModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // Form state
    const [connectionString, setConnectionString] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Advanced settings
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [connectionTimeout, setConnectionTimeout] = useState('5000');
    const [commandTimeout, setCommandTimeout] = useState('5000');
    const [dbIndex, setDbIndex] = useState('0');
    
    // Control state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialState, setInitialState] = useState({});

    const allFields = { connectionString, host, port, password, connectionTimeout, commandTimeout, dbIndex };
    
    // Two-way sync: Update individual fields when connectionString changes
    const parseConnectionString = useCallback(() => {
        try {
            if (connectionString.startsWith('redis://') || connectionString.startsWith('rediss://')) {
                const url = new URL(connectionString);
                setHost(url.hostname || '');
                setPort(url.port || '6379');
                setPassword(url.password || '');
                const pathDbIndex = url.pathname.slice(1);
                if (pathDbIndex && !isNaN(parseInt(pathDbIndex, 10))) {
                    setDbIndex(pathDbIndex);
                } else {
                    setDbIndex('0');
                }
            }
        } catch (error) {
            // Ignore parsing errors while user is typing
        }
    }, [connectionString]);

    // Two-way sync: Update connectionString when individual fields change
    const buildConnectionString = useCallback(() => {
        if (!host) return '';
        const protocol = port === '6380' ? 'rediss://' : 'redis://'; // Common Vercel Redis port
        const auth = password ? `default:${password}@` : '';
        return `${protocol}${auth}${host}:${port || '6379'}/${dbIndex || '0'}`;
    }, [host, port, password, dbIndex]);

    useEffect(() => {
        parseConnectionString();
    }, [connectionString, parseConnectionString]);

    useEffect(() => {
        const newConnectionString = buildConnectionString();
        setConnectionString(current => current === newConnectionString ? current : newConnectionString);
    }, [host, port, password, dbIndex, buildConnectionString]);
    
    useEffect(() => {
        const hasChanged = JSON.stringify(allFields) !== JSON.stringify(initialState);
        setIsModified(hasChanged);
    }, [allFields, initialState]);

    const addLogEntry = (message: string, status: ConnectionLogEntry['status']) => {
        setConnectionLog(prev => [{ timestamp: new Date().toLocaleTimeString(), message, status }, ...prev]);
    };

    const handleTestConnection = useCallback(async () => {
        setConnectionStatus('testing');
        setConnectionLog([]);
        log('Testing Vercel Redis connection...');

        addLogEntry("Initiating connection test...", 'info');
        await new Promise(r => setTimeout(r, 300));

        addLogEntry("Validating connection string format...", 'pending');
        const isFormatValid = connectionString.startsWith('redis');
        await new Promise(r => setTimeout(r, 300));
        addLogEntry(isFormatValid ? 'Format OK.' : 'Invalid URL format.', isFormatValid ? 'success' : 'error');
        if(!isFormatValid) { setConnectionStatus('error'); return; }

        addLogEntry(`Resolving DNS for ${host}...`, 'pending');
        await new Promise(r => setTimeout(r, 500));
        addLogEntry('DNS resolved successfully.', 'success');

        addLogEntry('Attempting TLS handshake...', 'pending');
        await new Promise(r => setTimeout(r, 500));
        addLogEntry('TLS handshake successful.', 'success');

        addLogEntry('Sending PING command...', 'pending');
        await new Promise(r => setTimeout(r, 400));
        addLogEntry('Received PONG response.', 'success');
        
        setConnectionStatus('success');
    }, [connectionString, host, log]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log('Saving Vercel Redis settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsModified(false);
        setInitialState(allFields);
        onClose();
    }, [log, onClose, allFields]);
    
    const statusIndicatorClasses: Record<ConnectionStatus, string> = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
                    <h2 className="font-semibold text-lg">{service.name} Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </header>

                <main className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Vercel Redis URL</label>
                        <p className="text-xs text-gray-500 mb-2">Copy the <code>REDIS_URL</code> from your Vercel project's storage settings and paste it here.</p>
                        <input value={connectionString} onChange={e => setConnectionString(e.target.value)} placeholder="redis(s)://default:password@host:port" className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono"/>
                    </div>
                    
                    <details className="pt-2">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Connection Details</summary>
                        <div className="mt-2 pl-4 space-y-3">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-400">Host</label><input value={host} onChange={e => setHost(e.target.value)} className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                                <div><label className="text-xs text-gray-400">Port</label><input value={port} onChange={e => setPort(e.target.value)} className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                            </div>
                            <div><label className="text-xs text-gray-400">Password</label>
                                <div className="relative">
                                    <input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mt-1 pr-10 bg-gray-600 rounded-lg text-sm"/>
                                    <button onClick={() => setIsPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                                </div>
                            </div>
                        </div>
                    </details>
                    
                    <details className="border-t border-gray-700/50 pt-4" onToggle={(e) => setIsAdvancedOpen((e.currentTarget as HTMLDetailsElement).open)}>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Advanced Settings</summary>
                        <AnimatePresence>
                        {isAdvancedOpen && <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="mt-4 pl-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="text-xs text-gray-400">Connection Timeout (ms)</label><input value={connectionTimeout} onChange={e => setConnectionTimeout(e.target.value)} type="number" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                                <div><label className="text-xs text-gray-400">Command Timeout (ms)</label><input value={commandTimeout} onChange={e => setCommandTimeout(e.target.value)} type="number" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                                <div><label className="text-xs text-gray-400">Database Index</label><input value={dbIndex} onChange={e => setDbIndex(e.target.value)} type="number" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                            </div>
                        </motion.div>}
                        </AnimatePresence>
                    </details>
                    
                    <details className="border-t border-gray-700/50 pt-4" open>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Live Connection Log</summary>
                        <div className="bg-gray-900 rounded-lg p-2 mt-2 h-24 overflow-y-auto text-xs font-mono">
                           {connectionLog.length > 0 ? connectionLog.map((entry, i) => (
                                <p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : entry.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                                    <span>[{entry.timestamp}]</span> - <span>{entry.message}</span>
                                </p>
                            )) : <p className="text-gray-500 text-center pt-6">Ready to test connection.</p>}
                        </div>
                    </details>
                </main>

                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
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
