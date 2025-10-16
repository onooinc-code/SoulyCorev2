
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon, RefreshIcon, CopyIcon, ArrowDownOnSquareIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useDataSourceSettings } from '@/lib/hooks/use-data-source-settings';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const MySQLModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    const {
        config,
        setConfig,
        isSaving,
        isModified,
        setIsModified,
        handleSave,
        connectionStatus,
        handleTestConnection,
        connectionLog,
        isLoading,
    } = useDataSourceSettings(service, onSaveSuccess);

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isSshPasswordVisible, setIsSshPasswordVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    // Two-way sync effect for connection string
    useEffect(() => {
        const { username, password, host, port, database, isSslEnabled } = config;
        if (!host || !port) return;
        const url = new URL(`mysql://${username || ''}:${password || ''}@${host}:${port}/${database || ''}`);
        if(isSslEnabled) url.searchParams.set('ssl', 'true');
        
        if (url.toString() !== config.connectionString) {
            setConfig(prev => ({ ...prev, connectionString: url.toString() }));
        }
    }, [config.host, config.port, config.database, config.username, config.password, config.isSslEnabled, setConfig]);

    const handleConnectionStringChange = (value: string) => {
        handleConfigChange('connectionString', value);
        try {
            const url = new URL(value);
            const newConfig = {
                host: url.hostname,
                port: url.port || '3306',
                database: url.pathname.slice(1),
                username: url.username,
                password: url.password,
                isSslEnabled: url.searchParams.has('ssl'),
            };
            setConfig(prev => ({...prev, ...newConfig}));
        } catch (e) {}
    };

    const handleConfigChange = (key: string, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setIsModified(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(config.connectionString || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    if (isLoading) {
        return <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101]"><p>Loading...</p></div>;
    }

    const statusIndicatorClasses: Record<string, string> = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Host</label><input value={config.host || ''} onChange={e => handleConfigChange('host', e.target.value)} placeholder="localhost" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                        <div><label className="text-xs text-gray-400">Port</label><input value={config.port || ''} onChange={e => handleConfigChange('port', e.target.value)} placeholder="3306" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    </div>
                    <div><label className="text-xs text-gray-400">Database Name</label><input value={config.database || ''} onChange={e => handleConfigChange('database', e.target.value)} placeholder="my_database" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    <div><label className="text-xs text-gray-400">Username</label><input value={config.username || ''} onChange={e => handleConfigChange('username', e.target.value)} placeholder="root" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    <div><label className="text-xs text-gray-400">Password</label><div className="relative"><input type={isPasswordVisible ? 'text' : 'password'} value={config.password || ''} onChange={e => handleConfigChange('password', e.target.value)} className="w-full p-2 mt-1 pr-10 bg-gray-700 rounded-lg text-sm"/><button onClick={() => setIsPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button></div></div>

                    <details className="border-t border-gray-700/50 pt-4">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Advanced Security Settings</summary>
                        <div className="mt-4 pl-4 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={config.isSslEnabled || false} onChange={e => handleConfigChange('isSslEnabled', e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600" /><span>Enable SSL/TLS</span></label>
                             <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={config.isSshEnabled || false} onChange={e => handleConfigChange('isSshEnabled', e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600" /><span>Connect via SSH Tunnel</span></label>
                        </div>
                    </details>
                    
                     <details className="border-t border-gray-700/50 pt-4" open>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Live Connection Log</summary>
                         <div className="bg-gray-900 rounded-lg p-2 mt-2 h-24 overflow-y-auto text-xs font-mono">
                            {connectionLog.length > 0 ? connectionLog.map((entry, i) => (<p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : 'text-red-400'}`}><span>[{entry.timestamp}]</span> - <span>{entry.message}</span></p>)) : <p className="text-gray-500 text-center pt-6">Ready to test connection.</p>}
                         </div>
                    </details>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
                        <button onClick={() => handleTestConnection(config)} disabled={connectionStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">{connectionStatus === 'testing' ? 'Testing...' : 'Test'}</button>
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={handleCopy} className="p-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500" title="Copy Connection String"><CopyIcon className="w-5 h-5"/></button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !isModified} className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};
