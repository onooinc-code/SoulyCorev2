
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon, CopyIcon, ArrowDownOnSquareIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useDataSourceSettings } from '@/lib/hooks/use-data-source-settings';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const MongoDBModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    const { config, setConfig, isSaving, isModified, setIsModified, handleSave, connectionStatus, handleTestConnection, connectionLog, isLoading } = useDataSourceSettings(service, onSaveSuccess);

    const [connectionMode, setConnectionMode] = useState<'string' | 'atlas'>('string');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    // Two-way sync
    useEffect(() => {
        const { useSrv, host, port, username, password, database, replicaSet, authSource, readPreference, additionalOptions } = config;
        if (!host) return;

        const protocol = useSrv ? 'mongodb+srv://' : 'mongodb://';
        const auth = username ? `${username}${password ? `:${password}` : ''}@` : '';
        const portString = useSrv ? '' : `:${port || '27017'}`;
        
        const params = new URLSearchParams();
        if (replicaSet) params.set('replicaSet', replicaSet);
        if (authSource) params.set('authSource', authSource);
        if (readPreference && readPreference !== 'primary') params.set('readPreference', readPreference);
        try {
            if (additionalOptions) {
                const parsedOptions = JSON.parse(additionalOptions);
                Object.entries(parsedOptions).forEach(([key, value]) => params.set(key, String(value)));
            }
        } catch (e) {}

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const newString = `${protocol}${auth}${host}${portString}/${database || ''}${queryString}`;

        if (newString !== config.connectionString) {
            setConfig(prev => ({ ...prev, connectionString: newString }));
        }
    }, [config.useSrv, config.host, config.port, config.username, config.password, config.database, config.replicaSet, config.authSource, config.readPreference, config.additionalOptions, setConfig]);
    
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
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-3xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div className="flex justify-center p-1 bg-gray-900/50 rounded-lg">
                        <button onClick={() => setConnectionMode('string')} className={`px-4 py-1.5 text-sm rounded-md w-1/2 ${connectionMode === 'string' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Connection String</button>
                        <button onClick={() => setConnectionMode('atlas')} className={`px-4 py-1.5 text-sm rounded-md w-1/2 ${connectionMode === 'atlas' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Connect with Atlas</button>
                    </div>
                    {connectionMode === 'string' ? (
                        <>
                            <input value={config.connectionString || ''} onChange={e => handleConfigChange('connectionString', e.target.value)} placeholder="mongodb+srv://..." className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono"/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input value={config.host || ''} onChange={e => handleConfigChange('host', e.target.value)} placeholder="Host" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                                <input value={config.port || '27017'} onChange={e => handleConfigChange('port', e.target.value)} placeholder="Port" disabled={config.useSrv} className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            </div>
                        </>
                    ) : (
                         <div className="text-center p-8 bg-gray-900/50 rounded-lg"><a href="https://cloud.mongodb.com/" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500">Get Connection String from Atlas</a></div>
                    )}
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`}></div>
                        <button onClick={() => handleTestConnection(config)} disabled={connectionStatus === 'testing' || connectionMode === 'atlas'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">{connectionStatus === 'testing' ? 'Testing...' : 'Test'}</button>
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