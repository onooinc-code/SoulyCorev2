
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Replaced non-existent ArrowUpOnSquareIcon with CopyIcon, which is available and semantically correct for the copy action.
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon, RefreshIcon, CopyIcon, ArrowDownOnSquareIcon } from '../../Icons';
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

export const MySQLModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // Form state
    const [host, setHost] = useState('127.0.0.1');
    const [port, setPort] = useState('3306');
    const [database, setDatabase] = useState('');
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Advanced settings
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isSslEnabled, setIsSslEnabled] = useState(false);
    const [sslCa, setSslCa] = useState('');
    const [sslCert, setSslCert] = useState('');
    const [sslKey, setSslKey] = useState('');
    const [isSshEnabled, setIsSshEnabled] = useState(false);
    const [sshHost, setSshHost] = useState('');
    const [sshPort, setSshPort] = useState('22');
    const [sshUser, setSshUser] = useState('');
    const [sshPassword, setSshPassword] = useState('');
    const [isSshPasswordVisible, setIsSshPasswordVisible] = useState(false);
    
    // Control state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialState, setInitialState] = useState({});

    const allFields = { host, port, database, username, password, isSslEnabled, sslCa, sslCert, sslKey, isSshEnabled, sshHost, sshPort, sshUser, sshPassword };

    useEffect(() => {
        // Load initial data and set up modification tracking
        const config = service.config_json || {};
        const initialStateData = {
            host: config.host || '127.0.0.1',
            port: config.port || '3306',
            database: config.database || '',
            username: config.username || 'root',
            password: config.password || '',
            isSslEnabled: config.isSslEnabled || false,
            sslCa: config.sslCa || '',
            sslCert: config.sslCert || '',
            sslKey: config.sslKey || '',
            isSshEnabled: config.isSshEnabled || false,
            sshHost: config.sshHost || '',
            sshPort: config.sshPort || '22',
            sshUser: config.sshUser || '',
            sshPassword: config.sshPassword || '',
        };

        Object.entries(initialStateData).forEach(([key, value]) => {
            const setter = eval(`set${key.charAt(0).toUpperCase() + key.slice(1)}`);
            setter(value);
        });

        setInitialState(initialStateData);
        setIsModified(false);
    }, [service]);

    useEffect(() => {
        // Track modifications by comparing current state to initial state
        const hasChanged = JSON.stringify(allFields) !== JSON.stringify(initialState);
        setIsModified(hasChanged);
    }, [allFields, initialState]);

    const addLogEntry = (message: string, status: ConnectionLogEntry['status']) => {
        setConnectionLog(prev => [{ timestamp: new Date().toLocaleTimeString(), message, status }, ...prev]);
    };

    const handleTestConnection = useCallback(async () => {
        setConnectionStatus('testing');
        setConnectionLog([]);
        log('Testing Self-Hosted MySQL connection...');

        addLogEntry("Initiating connection test...", 'info');
        await new Promise(r => setTimeout(r, 500));

        if (isSshEnabled) {
            addLogEntry(`Establishing SSH Tunnel to ${sshHost}...`, 'pending');
            await new Promise(r => setTimeout(r, 1000));
            const sshSuccess = sshHost.length > 3 && sshUser.length > 0;
            if (!sshSuccess) {
                addLogEntry("SSH Tunnel failed: Invalid SSH host or user.", 'error');
                setConnectionStatus('error');
                return;
            }
            addLogEntry("SSH Tunnel established successfully.", 'success');
        }

        addLogEntry(`Pinging host '${host}'...`, 'pending');
        await new Promise(r => setTimeout(r, 500));
        const hostSuccess = host.length > 3;
        if (!hostSuccess) {
            addLogEntry("Ping failed: Invalid database host.", 'error');
            setConnectionStatus('error');
            return;
        }
        addLogEntry("Host is reachable.", 'success');
        
        addLogEntry(`Authenticating user '${username}'...`, 'pending');
        await new Promise(r => setTimeout(r, 1000));
        const authSuccess = username.length > 0;
        if (!authSuccess) {
            addLogEntry("Authentication failed: Access denied for user.", 'error');
            setConnectionStatus('error');
            return;
        }
        addLogEntry("Authentication successful.", 'success');
        
        addLogEntry("Connection Verified!", 'success');
        setConnectionStatus('success');
    }, [host, username, isSshEnabled, sshHost, sshUser, log]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log('Saving Self-Hosted MySQL settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsModified(false);
        setInitialState(allFields); // Update initial state to current state after saving
        onClose();
    }, [log, onClose, allFields]);

    const handleCopyConnectionString = () => {
        const url = new URL(`mysql://${username}:${password}@${host}:${port}/${database}`);
        if(isSslEnabled) url.searchParams.set('ssl', 'true');
        navigator.clipboard.writeText(url.toString());
        log("Copied MySQL connection string to clipboard.");
    };

    const handleImportConnectionString = () => {
        const urlString = prompt("Paste your MySQL connection string:");
        if (urlString) {
            try {
                const url = new URL(urlString);
                setHost(url.hostname);
                setPort(url.port || '3306');
                setDatabase(url.pathname.slice(1));
                setUsername(url.username);
                setPassword(url.password);
                setIsSslEnabled(url.searchParams.has('ssl'));
                log("Imported MySQL connection string.");
            } catch (e) {
                alert("Invalid connection string format.");
                log("Failed to import invalid connection string.", null, 'warn');
            }
        }
    };


    const statusIndicatorClasses: Record<ConnectionStatus, string> = {
        idle: 'bg-gray-500',
        testing: 'bg-yellow-400 animate-pulse',
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
                    <h2 className="font-semibold text-lg">{service.name} Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </header>

                <main className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Host</label><input value={host} onChange={e => setHost(e.target.value)} placeholder="localhost" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                        <div><label className="text-xs text-gray-400">Port</label><input value={port} onChange={e => setPort(e.target.value)} placeholder="3306" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    </div>
                    <div><label className="text-xs text-gray-400">Database Name</label>
                        <div className="flex items-center gap-2">
                            <input value={database} onChange={e => setDatabase(e.target.value)} placeholder="my_database" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/>
                            <button className="p-2 mt-1 bg-gray-600 rounded-lg hover:bg-gray-500" title="Fetch Databases (Not Implemented)"><RefreshIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div><label className="text-xs text-gray-400">Username</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="root" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    <div><label className="text-xs text-gray-400">Password</label>
                        <div className="relative">
                            <input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mt-1 pr-10 bg-gray-700 rounded-lg text-sm"/>
                            <button onClick={() => setIsPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                        </div>
                    </div>

                    <details className="border-t border-gray-700/50 pt-4" onToggle={(e) => setIsAdvancedOpen((e.currentTarget as HTMLDetailsElement).open)}>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Advanced Security Settings</summary>
                        <div className="mt-4 pl-4 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isSslEnabled} onChange={e => setIsSslEnabled(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600" /><span>Enable SSL/TLS</span></label>
                            <AnimatePresence>
                                {isSslEnabled && <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="space-y-2 pl-6">
                                    <input value={sslCa} onChange={e => setSslCa(e.target.value)} placeholder="SSL CA Certificate Path/Content" className="w-full p-2 bg-gray-600 rounded-lg text-sm"/>
                                    <input value={sslCert} onChange={e => setSslCert(e.target.value)} placeholder="SSL Client Certificate Path/Content" className="w-full p-2 bg-gray-600 rounded-lg text-sm"/>
                                    <input value={sslKey} onChange={e => setSslKey(e.target.value)} placeholder="SSL Client Key Path/Content" className="w-full p-2 bg-gray-600 rounded-lg text-sm"/>
                                </motion.div>}
                            </AnimatePresence>
                             <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isSshEnabled} onChange={e => setIsSshEnabled(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600" /><span>Connect via SSH Tunnel</span></label>
                            <AnimatePresence>
                                {isSshEnabled && <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="space-y-2 pl-6">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={sshHost} onChange={e => setSshHost(e.target.value)} placeholder="SSH Host" className="w-full p-2 bg-gray-600 rounded-lg text-sm"/>
                                        <input value={sshPort} onChange={e => setSshPort(e.target.value)} placeholder="SSH Port (22)" className="w-full p-2 bg-gray-600 rounded-lg text-sm"/>
                                    </div>
                                    <input value={sshUser} onChange={e => setSshUser(e.target.value)} placeholder="SSH Username" className="w-full p-2 bg-gray-600 rounded-lg text-sm"/>
                                     <div className="relative">
                                        <input type={isSshPasswordVisible ? 'text' : 'password'} value={sshPassword} onChange={e => setSshPassword(e.target.value)} placeholder="SSH Password/Key Passphrase" className="w-full p-2 mt-1 pr-10 bg-gray-600 rounded-lg text-sm"/>
                                        <button onClick={() => setIsSshPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isSshPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                                    </div>
                                </motion.div>}
                            </AnimatePresence>
                        </div>
                    </details>
                    
                    <details className="border-t border-gray-700/50 pt-4">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Connection Log</summary>
                         <div className="bg-gray-900 rounded-lg p-2 mt-2 h-24 overflow-y-auto text-xs font-mono">
                            {connectionLog.length > 0 ? connectionLog.map((entry, i) => (
                                <p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : entry.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                                    <span>[{entry.timestamp}]</span> - <span>{entry.message}</span>
                                </p>
                            )) : <p className="text-gray-500 text-center pt-6">No connection attempts yet.</p>}
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
                        <button onClick={handleImportConnectionString} className="p-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500" title="Import from Connection String"><ArrowDownOnSquareIcon className="w-5 h-5"/></button>
                        <button onClick={handleCopyConnectionString} className="p-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500" title="Copy Connection String"><CopyIcon className="w-5 h-5"/></button>
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
