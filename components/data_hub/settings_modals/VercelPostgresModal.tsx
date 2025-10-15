
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CopyIcon, ClearIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

export const VercelPostgresModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // State for individual fields
    const [host, setHost] = useState('');
    const [port, setPort] = useState('5432');
    const [dbName, setDbName] = useState('');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [useSsl, setUseSsl] = useState(true);

    // State for the combined connection string
    const [connectionString, setConnectionString] = useState('');

    // Control flags
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isModified, setIsModified] = useState(false);

    // Two-way sync: Update individual fields when connectionString changes
    useEffect(() => {
        try {
            if (connectionString.startsWith('postgres://')) {
                const url = new URL(connectionString);
                setHost(url.hostname || '');
                setPort(url.port || '5432');
                setDbName(url.pathname.slice(1) || '');
                setUser(url.username || '');
                setPassword(url.password || '');
                setUseSsl(url.searchParams.get('sslmode') !== 'disable');
            }
        } catch (error) {
            log('Invalid connection string format.', { error }, 'warn');
        }
    }, [connectionString, log]);

    // Two-way sync: Update connectionString when individual fields change
    useEffect(() => {
        const buildConnectionString = () => {
            if (!user || !host || !dbName) return '';
            const auth = password ? `${user}:${password}` : user;
            const sslParam = useSsl ? '' : '?sslmode=disable';
            return `postgres://${auth}@${host}:${port}/${dbName}${sslParam}`;
        };
        const newConnectionString = buildConnectionString();
        // Update connection string state without triggering the reverse effect
        if (newConnectionString !== connectionString) {
            setConnectionString(newConnectionString);
        }
    }, [host, port, dbName, user, password, useSsl]);
    
    const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        setIsModified(true);
    };

    const handleClear = () => {
        setHost('');
        setPort('5432');
        setDbName('');
        setUser('');
        setPassword('');
        setUseSsl(true);
        setConnectionString('');
        setIsModified(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(connectionString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTest = useCallback(async () => {
        setIsTesting(true);
        setTestResult(null);
        log('Testing Vercel Postgres connection...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        // Simulate a 90% success rate
        const success = Math.random() < 0.9;
        setTestResult(success ? 'success' : 'error');
        setIsTesting(false);
    }, [log]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log('Saving Vercel Postgres settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsModified(false);
        onClose();
    }, [log, onClose]);
    
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
                    {/* Connection String Input */}
                    <div>
                        <label className="text-sm font-medium text-gray-300">Connection String</label>
                        <p className="text-xs text-gray-500 mb-2">Paste a full string here, or fill the fields below to construct one.</p>
                        <div className="relative">
                            <input
                                type="text"
                                value={connectionString}
                                onChange={(e) => {
                                    setConnectionString(e.target.value);
                                    setIsModified(true);
                                }}
                                placeholder="postgres://user:password@host:port/dbname"
                                className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" title="Copy to clipboard">
                                {copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-gray-700 my-4"></div>

                    {/* Individual Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={host} onChange={handleFieldChange(setHost)} placeholder="Host" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                        <input value={port} onChange={handleFieldChange(setPort)} placeholder="Port" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    </div>
                    <input value={dbName} onChange={handleFieldChange(setDbName)} placeholder="Database Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={user} onChange={handleFieldChange(setUser)} placeholder="Username" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                        <input type="password" value={password} onChange={handleFieldChange(setPassword)} placeholder="Password" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    </div>

                    {/* SSL Toggle */}
                    <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={useSsl} 
                            onChange={(e) => {
                                setUseSsl(e.target.checked);
                                setIsModified(true);
                            }} 
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Use SSL/TLS</span>
                    </label>

                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                     <div className="flex items-center gap-2">
                        <button onClick={handleTest} disabled={isTesting} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testResult === 'success' && <span className="text-sm text-green-400">Connection successful!</span>}
                        {testResult === 'error' && <span className="text-sm text-red-400">Connection failed.</span>}
                    </div>
                     <div className="flex items-center gap-2">
                        {/* FIX: Moved title attribute from icon to parent button to resolve type error. */}
                        <button onClick={handleClear} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500" title="Clear Fields">
                            <ClearIcon className="w-5 h-5"/>
                        </button>
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
