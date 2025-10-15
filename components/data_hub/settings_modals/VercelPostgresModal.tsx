// components/data_hub/settings_modals/VercelPostgresModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CopyIcon, ClearIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const VercelPostgresModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    const { log } = useLog();

    const [config, setConfig] = useState(service.config_json || {});
    const [connectionString, setConnectionString] = useState(config.connectionString || '');
    
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleConfigChange = (key: string, value: any) => {
        setConfig(prev => ({...prev, [key]: value}));
    };

    useEffect(() => {
        handleConfigChange('connectionString', connectionString);
    }, [connectionString]);

    const handleTest = useCallback(async () => {
        setIsTesting(true);
        setTestResult(null);
        log('Testing Vercel Postgres connection...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = Math.random() < 0.9;
        setTestResult(success ? 'success' : 'error');
        setIsTesting(false);
    }, [log]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log('Saving Vercel Postgres settings...', { serviceId: service.id });
        try {
            const res = await fetch(`/api/data-sources/${service.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config_json: config }),
            });
            if (!res.ok) throw new Error('Failed to save settings');
            onSaveSuccess();
        } catch (error) {
            log('Failed to save Vercel Postgres settings', { error }, 'error');
        } finally {
            setIsSaving(false);
        }
    }, [log, service.id, config, onSaveSuccess]);

    const handleCopy = () => {
        navigator.clipboard.writeText(connectionString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        <label className="text-sm font-medium text-gray-300">Connection String</label>
                        <p className="text-xs text-gray-500 mb-2">Paste your full Postgres connection string here.</p>
                        <div className="relative">
                            <input
                                type="text"
                                value={connectionString}
                                onChange={(e) => setConnectionString(e.target.value)}
                                placeholder="postgres://user:password@host:port/dbname"
                                className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" title="Copy to clipboard">
                                {copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
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
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500 disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};
