
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CopyIcon, TrashIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

export const VercelPostgresModal = ({ service, onClose }: ModalProps) => {
    const [host, setHost] = useState('db.example.com');
    const [port, setPort] = useState('5432');
    const [database, setDatabase] = useState('mydatabase');
    const [user, setUser] = useState('myuser');
    const [password, setPassword] = useState('');
    const [ssl, setSsl] = useState(true);
    const [connectionString, setConnectionString] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    useEffect(() => {
        // This effect dynamically builds the connection string whenever a field changes.
        const userPart = user ? encodeURIComponent(user) : '';
        const passPart = password ? `:${encodeURIComponent(password)}` : '';
        const authPart = userPart ? `${userPart}${passPart}@` : '';
        const portPart = port ? `:${port}` : '';
        const dbPart = database ? `/${encodeURIComponent(database)}` : '';
        const sslPart = ssl ? '?sslmode=require' : '';

        // Only construct if host is present
        const finalString = host ? `postgres://${authPart}${host}${portPart}${dbPart}${sslPart}` : '';
        setConnectionString(finalString);
    }, [host, port, database, user, password, ssl]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(connectionString);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [connectionString]);

    const handleClear = () => {
        setHost('');
        setPort('');
        setDatabase('');
        setUser('');
        setPassword('');
        setSsl(true);
        setTestStatus('idle');
    };
    
    const handleTestConnection = () => {
        setTestStatus('testing');
        // Simulate API call
        setTimeout(() => {
            // Simulate a 50/50 chance of success/failure for demonstration
            if (Math.random() > 0.5 && host && database) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
            }
        }, 1500);
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
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="font-semibold text-lg">{service.name} Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-gray-400">Configure the connection to your Vercel Postgres database. These values are found in your Vercel project's environment variables.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-3">
                            <label className="text-xs text-gray-400">Host</label>
                            <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="e.g., okl.hin.postgres.vercel-storage.com" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400">Port</label>
                            <input type="text" value={port} onChange={e => setPort(e.target.value)} placeholder="5432" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400">Database Name</label>
                        <input type="text" value={database} onChange={e => setDatabase(e.target.value)} placeholder="postgres" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400">Username</label>
                            <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="default" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                        <label htmlFor="ssl-toggle" className="text-sm font-medium">Use SSL/TLS</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="ssl-toggle" checked={ssl} onChange={e => setSsl(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400">Generated Connection String (Read-Only)</label>
                        <div className="relative">
                            <textarea
                                readOnly
                                value={connectionString}
                                className="w-full p-2 mt-1 bg-gray-900/80 rounded-lg text-sm font-mono text-gray-400 resize-none pr-10"
                                rows={3}
                            />
                            <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md" title="Copy to clipboard">
                                {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-gray-700">
                    <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-md text-sm hover:bg-gray-600" title="Clear all input fields">
                        <TrashIcon className="w-4 h-4"/> Clear Fields
                    </button>
                    <div className="flex items-center gap-2">
                         <button onClick={handleTestConnection} disabled={testStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">
                            {testStatus === 'testing' && <motion.div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                            {testStatus === 'success' && <CheckIcon className="w-4 h-4" />}
                            {testStatus === 'error' && <XIcon className="w-4 h-4" />}
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500">Save Changes</button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};
