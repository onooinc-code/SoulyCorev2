
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon, CopyIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useDataSourceSettings } from '@/lib/hooks/use-data-source-settings';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const GraphDBModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    const { config, setConfig, isSaving, isModified, setIsModified, handleSave, connectionStatus, handleTestConnection, connectionLog, isLoading } = useDataSourceSettings(service, onSaveSuccess);

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    // Sync from individual fields to connectionString
    useEffect(() => {
        const { protocol, host, port, username, password, database } = config;
        if (!host || !port) return;
        const auth = username ? `${username}${password ? `:${password}` : ''}@` : '';
        const newString = `${protocol || 'bolt://'}${auth}${host}:${port}/${database || ''}`;
        if (newString !== config.connectionString) {
            setConfig(prev => ({...prev, connectionString: newString}));
        }
    }, [config.protocol, config.host, config.port, config.username, config.password, config.database, setConfig]);

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
    
    const statusIndicatorClasses = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Connection String</label>
                        <div className="relative mt-1"><input value={config.connectionString || ''} onChange={e => handleConfigChange('connectionString', e.target.value)} placeholder="protocol://user:pass@host:port/db" className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm font-mono"/><button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" title="Copy">{copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}</button></div>
                    </div>
                    <div className="h-px bg-gray-700 my-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-xs text-gray-400">Protocol</label><select value={config.protocol || 'bolt://'} onChange={e => handleConfigChange('protocol', e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"><option>bolt://</option><option>neo4j://</option><option>http://</option><option>https://</option></select></div>
                        <div><label className="text-xs text-gray-400">Host</label><input value={config.host || ''} onChange={e => handleConfigChange('host', e.target.value)} placeholder="localhost" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                        <div><label className="text-xs text-gray-400">Port</label><input value={config.port || '7687'} onChange={e => handleConfigChange('port', e.target.value)} placeholder="7687" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Username</label><input value={config.username || 'neo4j'} onChange={e => handleConfigChange('username', e.target.value)} placeholder="neo4j" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                        <div><label className="text-xs text-gray-400">Password</label><div className="relative"><input type={isPasswordVisible ? 'text' : 'password'} value={config.password || ''} onChange={e => handleConfigChange('password', e.target.value)} className="w-full p-2 mt-1 pr-10 bg-gray-700 rounded-lg text-sm"/><button onClick={() => setIsPasswordVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-0.5 text-gray-400 hover:text-white">{isPasswordVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button></div></div>
                    </div>
                    <div><label className="text-xs text-gray-400">Database Name (Optional)</label><input value={config.database || ''} onChange={e => handleConfigChange('database', e.target.value)} placeholder="neo4j" className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
                        <button onClick={() => handleTestConnection(config)} disabled={connectionStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">{connectionStatus === 'testing' ? 'Testing...' : 'Test'}</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !isModified} className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};