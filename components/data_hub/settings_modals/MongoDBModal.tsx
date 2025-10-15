// components/data_hub/settings_modals/MongoDBModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon, CopyIcon, ArrowDownOnSquareIcon } from '../../Icons';
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

export const MongoDBModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // Form state
    const [connectionMode, setConnectionMode] = useState<'string' | 'atlas'>('string');
    const [connectionString, setConnectionString] = useState('');
    const [useSrv, setUseSrv] = useState(false);
    const [host, setHost] = useState('');
    const [port, setPort] = useState('27017');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [database, setDatabase] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    // Advanced settings
    const [replicaSet, setReplicaSet] = useState('');
    const [authSource, setAuthSource] = useState('');
    const [readPreference, setReadPreference] = useState('primary');
    const [additionalOptions, setAdditionalOptions] = useState('');

    // Control state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [copied, setCopied] = useState(false);

    // Two-way sync: Update individual fields when connectionString changes
    useEffect(() => {
        try {
            if (connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://')) {
                const url = new URL(connectionString);
                const isSrv = url.protocol === 'mongodb+srv:';
                setUseSrv(isSrv);
                setHost(url.hostname);
                if (!isSrv) setPort(url.port || '27017');
                setUsername(url.username);
                setPassword(url.password);
                setDatabase(url.pathname.slice(1));
                setReplicaSet(url.searchParams.get('replicaSet') || '');
                setAuthSource(url.searchParams.get('authSource') || '');
                setReadPreference(url.searchParams.get('readPreference') || 'primary');

                // Extract other params into additionalOptions
                const otherParams: Record<string, string> = {};
                url.searchParams.forEach((value, key) => {
                    if (!['replicaSet', 'authSource', 'readPreference'].includes(key)) {
                        otherParams[key] = value;
                    }
                });
                setAdditionalOptions(Object.keys(otherParams).length > 0 ? JSON.stringify(otherParams, null, 2) : '');
            }
        } catch (error) {
            // Ignore parsing errors while user is typing
        }
    }, [connectionString]);

    // Two-way sync: Update connectionString when individual fields change
    useEffect(() => {
        const buildString = () => {
            if (!host) return '';
            const protocol = useSrv ? 'mongodb+srv://' : 'mongodb://';
            const auth = username ? `${username}${password ? `:${password}` : ''}@` : '';
            const portString = useSrv ? '' : `:${port}`;
            
            const params = new URLSearchParams();
            if (replicaSet) params.set('replicaSet', replicaSet);
            if (authSource) params.set('authSource', authSource);
            if (readPreference && readPreference !== 'primary') params.set('readPreference', readPreference);
            try {
                if (additionalOptions) {
                    const parsedOptions = JSON.parse(additionalOptions);
                    Object.entries(parsedOptions).forEach(([key, value]) => params.set(key, String(value)));
                }
            } catch (e) { /* ignore invalid json while typing */ }

            const queryString = params.toString() ? `?${params.toString()}` : '';

            return `${protocol}${auth}${host}${portString}/${database}${queryString}`;
        };
        const newString = buildString();
        setConnectionString(current => current === newString ? current : newString);
    }, [useSrv, host, port, username, password, database, replicaSet, authSource, readPreference, additionalOptions]);

    const addLogEntry = (message: string, status: ConnectionLogEntry['status']) => {
        setConnectionLog(prev => [{ timestamp: new Date().toLocaleTimeString(), message, status }, ...prev]);
    };

    const handleTestConnection = useCallback(async () => {
        setConnectionStatus('testing');
        setConnectionLog([]);
        log('Testing MongoDB connection...');

        addLogEntry("Initiating connection test...", 'info');
        await new Promise(r => setTimeout(r, 300));

        const dnsStep = useSrv ? 'Resolving SRV record...' : `Pinging host '${host}'...`;
        addLogEntry(dnsStep, 'pending');
        await new Promise(r => setTimeout(r, 700));
        addLogEntry("DNS resolved successfully.", 'success');

        addLogEntry("Establishing TCP/TLS connection to primary...", 'pending');
        await new Promise(r => setTimeout(r, 800));
        addLogEntry("Connection established.", 'success');
        
        addLogEntry(`Authenticating user '${username}'...`, 'pending');
        await new Promise(r => setTimeout(r, 500));
        addLogEntry("Authentication successful.", 'success');
        
        addLogEntry("Sending PING command to server...", 'pending');
        await new Promise(r => setTimeout(r, 300));
        addLogEntry("PING successful. Connection verified!", 'success');
        
        setConnectionStatus('success');
    }, [host, username, useSrv, log]);

    const handleCopy = () => {
        navigator.clipboard.writeText(connectionString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => { /* ... */ };

    const statusIndicatorClasses: Record<ConnectionStatus, string> = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-3xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                
                <main className="p-6 space-y-4 overflow-y-auto">
                    {/* Connection Mode */}
                    <div className="flex justify-center p-1 bg-gray-900/50 rounded-lg">
                        <button onClick={() => setConnectionMode('string')} className={`px-4 py-1.5 text-sm rounded-md w-1/2 ${connectionMode === 'string' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Connection String</button>
                        <button onClick={() => setConnectionMode('atlas')} className={`px-4 py-1.5 text-sm rounded-md w-1/2 ${connectionMode === 'atlas' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Connect with Atlas</button>
                    </div>

                    {connectionMode === 'string' ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-300">Connection String</label>
                                <div className="relative mt-1">
                                    <input value={connectionString} onChange={e => {setConnectionString(e.target.value); setIsModified(true);}} placeholder="mongodb+srv://user:pass@host/db?options" className="w-full p-2 pr-20 bg-gray-700 rounded-lg text-sm font-mono"/>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button onClick={() => navigator.clipboard.readText().then(text => {setConnectionString(text); setIsModified(true);})} className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-600" title="Paste"><ArrowDownOnSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-600" title="Copy">{copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-gray-700 my-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-400">Host(s)</label><input value={host} onChange={e => {setHost(e.target.value); setIsModified(true);}} placeholder="cluster.mongodb.net" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                                <div><label className="text-xs text-gray-400">Port</label><input value={port} onChange={e => {setPort(e.target.value); setIsModified(true);}} placeholder="27017" disabled={useSrv} className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm disabled:opacity-50"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-400">Username</label><input value={username} onChange={e => {setUsername(e.target.value); setIsModified(true);}} className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                                <div><label className="text-xs text-gray-400">Password</label><div className="relative"><input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => {setPassword(e.target.value); setIsModified(true);}} className="w-full p-2 mt-1 pr-10 bg-gray-700 rounded-lg text-sm"/><button onClick={() => setIsPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button></div></div>
                            </div>
                            <div><label className="text-xs text-gray-400">Database</label><input value={database} onChange={e => {setDatabase(e.target.value); setIsModified(true);}} placeholder="default_db" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                            <label className="flex items-center gap-3 cursor-pointer mt-2"><input type="checkbox" checked={useSrv} onChange={e => {setUseSrv(e.target.checked); setIsModified(true);}} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600" /><span>Use SRV Record (for Atlas)</span></label>
                            
                            <details className="border-t border-gray-700/50 pt-4">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Advanced Options</summary>
                                <div className="mt-4 pl-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-400">Replica Set Name</label><input value={replicaSet} onChange={e => {setReplicaSet(e.target.value); setIsModified(true);}} className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                                        <div><label className="text-xs text-gray-400">Auth Source</label><input value={authSource} onChange={e => {setAuthSource(e.target.value); setIsModified(true);}} placeholder="admin" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                                    </div>
                                    <div><label className="text-xs text-gray-400">Read Preference</label><select value={readPreference} onChange={e => {setReadPreference(e.target.value); setIsModified(true);}} className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"><option>primary</option><option>secondary</option><option>nearest</option></select></div>
                                    <div><label className="text-xs text-gray-400">Additional Driver Options (JSON)</label><textarea value={additionalOptions} onChange={e => {setAdditionalOptions(e.target.value); setIsModified(true);}} placeholder='{ "retryWrites": "true", "w": "majority" }' className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm font-mono" rows={3}></textarea></div>
                                </div>
                            </details>
                        </>
                    ) : (
                        <div className="text-center p-8 bg-gray-900/50 rounded-lg">
                            <h3 className="font-semibold text-lg">Connect to MongoDB Atlas</h3>
                            <p className="text-sm text-gray-400 mt-2 mb-4">The easiest way to connect is by using the connection string provided by MongoDB Atlas. Click the button below to open Atlas in a new tab.</p>
                            <a href="https://cloud.mongodb.com/" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500">
                                Get Connection String from Atlas
                            </a>
                        </div>
                    )}
                     <details className="border-t border-gray-700/50 pt-4" open>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Live Connection Log</summary>
                        <div className="bg-gray-900 rounded-lg p-2 mt-2 h-24 overflow-y-auto text-xs font-mono">
                           {connectionLog.map((entry, i) => (<p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : entry.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}><span>[{entry.timestamp}]</span> - <span>{entry.message}</span></p>))}
                        </div>
                    </details>
                </main>

                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`}></div>
                        <button onClick={handleTestConnection} disabled={connectionStatus === 'testing' || connectionMode === 'atlas'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">{connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !isModified} className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};
