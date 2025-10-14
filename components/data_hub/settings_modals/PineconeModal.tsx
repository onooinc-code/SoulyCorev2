
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

export const PineconeModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    const [apiKey, setApiKey] = useState('');
    const [environment, setEnvironment] = useState('');
    const [indexName, setIndexName] = useState('');
    const [projectId, setProjectId] = useState('');
    const [namespace, setNamespace] = useState('');

    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);

    // Load initial settings from service.config_json if available
    useEffect(() => {
        if (service.config_json) {
            setApiKey(service.config_json.apiKey || '');
            setEnvironment(service.config_json.environment || '');
            setIndexName(service.config_json.indexName || '');
            setProjectId(service.config_json.projectId || '');
            setNamespace(service.config_json.namespace || '');
        }
        setIsModified(false); // Reset modified state on initial load
    }, [service]);

    const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        setIsModified(true);
    };

    const handleTest = useCallback(async () => {
        setIsTesting(true);
        setTestResult(null);
        log('Testing Pinecone connection...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        const success = apiKey.length > 5 && environment.length > 3; // Simple validation simulation
        setTestResult(success ? 'success' : 'error');
        setIsTesting(false);
    }, [log, apiKey, environment]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log('Saving Pinecone settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In a real app, you would send this to an API endpoint
        // e.g., PUT /api/data-sources/{service.id} with the new config
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
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-indigo-500/30"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="font-semibold text-lg">{service.name} Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-300">API Key</label>
                        <p className="text-xs text-gray-500 mb-2">Your secret Pinecone API key.</p>
                        <input type="password" value={apiKey} onChange={handleFieldChange(setApiKey)} placeholder="Your Pinecone API Key" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">Environment</label>
                         <p className="text-xs text-gray-500 mb-2">The cloud environment where your index is hosted (e.g., `gcp-starter`).</p>
                        <input type="text" value={environment} onChange={handleFieldChange(setEnvironment)} placeholder="e.g., us-west1-gcp" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">Index Name</label>
                         <p className="text-xs text-gray-500 mb-2">The name of the Pinecone index to connect to.</p>
                        <input type="text" value={indexName} onChange={handleFieldChange(setIndexName)} placeholder="e.g., soul-knowledgebase" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">Project ID (Optional)</label>
                         <p className="text-xs text-gray-500 mb-2">Your Pinecone project ID, if required.</p>
                        <input type="text" value={projectId} onChange={handleFieldChange(setProjectId)} placeholder="Optional Project ID" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Namespace (Optional)</label>
                         <p className="text-xs text-gray-500 mb-2">Specify a namespace to isolate data within the index.</p>
                        <input type="text" value={namespace} onChange={handleFieldChange(setNamespace)} placeholder="Optional Namespace" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    </div>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                        <button onClick={handleTest} disabled={isTesting} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testResult === 'success' && <span className="text-sm text-green-400 flex items-center gap-1"><CheckIcon className="w-5 h-5"/> Connected</span>}
                        {testResult === 'error' && <span className="text-sm text-red-400">Connection failed.</span>}
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
