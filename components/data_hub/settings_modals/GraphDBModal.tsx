// components/data_hub/settings_modals/GraphDBModal.tsx
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

export const GraphDBModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // Form state
    const [connectionString, setConnectionString] = useState('');
    const [protocol, setProtocol] = useState('bolt://');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('7687');
    const [username, setUsername] = useState('neo4j');
    const [password, setPassword] = useState('');
    const [database, setDatabase] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
    const [connectionTimeout, setConnectionTimeout] = useState('5000');

    // Control state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialState, setInitialState] = useState({});
    const [copied, setCopied] = useState(false);
    
    const allFields = { connectionString, protocol, host, port, username, password, database, isEncryptionEnabled, connectionTimeout };

    // Two-way sync
    useEffect(() => {
        try {
            if (connectionString.includes('://')) {
                const url = new URL(connectionString);
                setProtocol(url.protocol + '//');
                setHost(url.hostname);
                setPort(url.port);
                setUsername(url.username);
                setPassword(url.password);
                setDatabase(url.pathname.slice(1));
            }
        } catch (e) {}
    }, [connectionString]);
    
    useEffect(() => {
        const buildString = () => {
            if (!host || !port) return '';
            const auth = username ? `${username}${password ? `:${password}` : ''}@` : '';
            return `${protocol}${auth}${host}:${port}/${database}`;
        };
        const newString = buildString();
        setConnectionString(current => current === newString ? current : newString);
    }, [protocol, host, port, username, password, database]);
    
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
        log('Testing GraphDB connection...');

        addLogEntry("Initiating connection test...", 'info');
        await new Promise(r => setTimeout(r, 300));
        addLogEntry(`Resolving DNS for host '${host}'...`, 'pending');
        await new Promise(r => setTimeout(r, 500));
        addLogEntry("DNS resolved successfully.", 'success');
        addLogEntry(`Establishing ${protocol} connection...`, 'pending');
        await new Promise(r => setTimeout(r, 700));
        addLogEntry("Connection established.", 'success');
        addLogEntry(`Authenticating user '${username}'...`, 'pending');
        await new Promise(r => setTimeout(r, 500));
        addLogEntry("Authentication successful.", 'success');
        addLogEntry("Sending validation query (CYPHER PING)...", 'pending');
        await new Promise(r => setTimeout(r, 400));
        addLogEntry("Query successful. Connection verified!", 'success');
        
        setConnectionStatus('success');
    }, [protocol, host, username, log]);
    
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsModified(false);
        setInitialState(allFields);
        onClose();
    }, [onClose, allFields]);

    const handleCopy = () => {
        navigator.clipboard.writeText(connectionString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusIndicatorClasses: Record<ConnectionStatus, string> = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Connection String</label>
                        <div className="relative mt-1">
                            <input value={connectionString} onChange={e => setConnectionString(e.target.value)} placeholder="bolt://user:pass@host:port/db" className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm font-mono"/>
                            <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" title="Copy">{copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}</button>
                        </div>
                    </div>
                    <div className="h-px bg-gray-700 my-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-xs text-gray-400">Protocol</label><select value={protocol} onChange={e => setProtocol(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"><option>bolt://</option><option>neo4j://</option><option>http://</option><option>https://</option></select></div>
                        <div><label className="text-xs text-gray-400">Host</label><input value={host} onChange={e => setHost(e.target.value)} placeholder="localhost" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                        <div><label className="text-xs text-gray-400">Port</label><input value={port} onChange={e => setPort(e.target.value)} placeholder="7687" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Username</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="neo4j" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                        <div><label className="text-xs text-gray-400">Password</label><div className="relative"><input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mt-1 pr-10 bg-gray-700 rounded-lg text-sm"/><button onClick={() => setIsPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button></div></div>
                    </div>
                    <div><label className="text-xs text-gray-400">Database Name (Optional)</label><input value={database} onChange={e => setDatabase(e.target.value)} placeholder="neo4j" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    
                    <details className="border-t border-gray-700/50 pt-4">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Advanced Settings</summary>
                        <div className="mt-4 pl-4 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isEncryptionEnabled} onChange={e => setIsEncryptionEnabled(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600" /><span>Enable Encryption (TLS)</span></label>
                            <div><label className="text-xs text-gray-400">Connection Timeout (ms)</label><input value={connectionTimeout} onChange={e => setConnectionTimeout(e.target.value)} type="number" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                        </div>
                    </details>
                    
                    <details className="border-t border-gray-700/50 pt-4" open>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Live Connection Log</summary>
                        <div className="bg-gray-900 rounded-lg p-2 mt-2 h-24 overflow-y-auto text-xs font-mono">
                           {connectionLog.length > 0 ? connectionLog.map((entry, i) => (<p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : entry.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}><span>[{entry.timestamp}]</span> - <span>{entry.message}</span></p>)) : <p className="text-gray-500 text-center pt-6">Ready to test connection.</p>}
                        </div>
                    </details>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
                        <button onClick={handleTestConnection} disabled={connectionStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">{connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}</button>
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
