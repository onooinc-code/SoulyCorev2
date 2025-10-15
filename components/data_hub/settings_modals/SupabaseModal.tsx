"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    status: 'pending' | 'success' | 'error';
}

export const SupabaseModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // Form state
    const [projectUrl, setProjectUrl] = useState('');
    const [anonKey, setAnonKey] = useState('');
    const [isKeyVisible, setIsKeyVisible] = useState(false);

    // Control state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLogs, setConnectionLogs] = useState<ConnectionLogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialState, setInitialState] = useState({ projectUrl, anonKey });
    
    // Load initial data and set up modification tracking
    useEffect(() => {
        const config = service.config_json || {};
        const initialUrl = config.projectUrl || '';
        const initialKey = config.anonKey || '';
        setProjectUrl(initialUrl);
        setAnonKey(initialKey);
        setInitialState({ projectUrl: initialUrl, anonKey: initialKey });
        setIsModified(false);
    }, [service]);

    // Track modifications
    useEffect(() => {
        if (initialState.projectUrl !== projectUrl || initialState.anonKey !== anonKey) {
            setIsModified(true);
        } else {
            setIsModified(false);
        }
    }, [projectUrl, anonKey, initialState]);

    const handleTestConnection = useCallback(async () => {
        setConnectionStatus('testing');
        log('Testing Supabase connection...');
        
        const logs: ConnectionLogEntry[] = [];
        const addLog = (message: string, status: ConnectionLogEntry['status'] = 'pending') => {
            logs.push({ timestamp: new Date().toLocaleTimeString(), message, status });
            setConnectionLogs([...logs]);
        };

        addLog("Initiating connection test...");
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate URL ping
        const isUrlValid = projectUrl.includes('supabase.co');
        addLog(`Pinging URL: ${projectUrl}`, isUrlValid ? 'success' : 'error');
        if (!isUrlValid) {
            setConnectionStatus('error');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate Key Auth
        const isKeyValid = anonKey.length > 50; // Simple heuristic
        addLog("Authenticating with Anon Key...", isKeyValid ? 'success' : 'error');
        if (!isKeyValid) {
             addLog("Authentication failed: Key appears invalid.", 'error');
            setConnectionStatus('error');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        
        addLog("Connection Verified!", 'success');
        setConnectionStatus('success');

    }, [projectUrl, anonKey, log]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log('Saving Supabase settings...');
        // In a real app, this would make a PUT request to /api/data-sources/{service.id}
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        setIsSaving(false);
        setIsModified(false);
        onClose();
    }, [log, onClose]);

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
                        <label className="text-sm font-medium text-gray-300">Project URL</label>
                        <p className="text-xs text-gray-500 mb-2">Find this in your Supabase project settings under 'API'.</p>
                        <input
                            type="text"
                            value={projectUrl}
                            onChange={e => setProjectUrl(e.target.value)}
                            placeholder="https://<project-ref>.supabase.co"
                            className="w-full p-2 bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300">Anon (Public) Key</label>
                         <p className="text-xs text-gray-500 mb-2">This key is safe to use in a browser and is used for row-level security.</p>
                        <div className="relative">
                            <input
                                type={isKeyVisible ? 'text' : 'password'}
                                value={anonKey}
                                onChange={e => setAnonKey(e.target.value)}
                                placeholder="Your Supabase anon key"
                                className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" title={isKeyVisible ? "Hide key" : "Show key"}>
                                {isKeyVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <details className="border-t border-gray-700/50 pt-4">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Connection Log</summary>
                        <div className="bg-gray-900 rounded-lg p-2 mt-2 h-32 overflow-y-auto text-xs font-mono">
                            {connectionLogs.length === 0 ? (
                                <p className="text-gray-500 text-center pt-8">No connection attempts yet.</p>
                            ) : (
                                connectionLogs.map((entry, index) => (
                                    <p key={index} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : entry.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                                        <span>[{entry.timestamp}]</span>
                                        <span>-</span>
                                        <span className="flex-1">{entry.message}</span>
                                    </p>
                                ))
                            )}
                        </div>
                    </details>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={handleTestConnection} disabled={connectionStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">
                            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                        <div className="flex items-center gap-2">
                             <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
                            <span className="text-sm text-gray-400 capitalize">{connectionStatus}</span>
                        </div>
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
