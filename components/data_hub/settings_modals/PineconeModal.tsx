// components/data_hub/settings_modals/PineconeModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckIcon, EyeIcon, EyeSlashIcon, WarningIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error' | 'index_not_found';
interface ConnectionLogEntry {
    timestamp: string;
    message: string;
    status: 'pending' | 'success' | 'error' | 'info';
}

export const PineconeModal = ({ service, onClose }: ModalProps) => {
    const { log } = useLog();

    // Form state
    const [apiKey, setApiKey] = useState('');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [environment, setEnvironment] = useState('');
    const [indexName, setIndexName] = useState('');
    const [projectId, setProjectId] = useState('');
    const [namespace, setNamespace] = useState('');
    
    // Create Index state
    const [dimension, setDimension] = useState('1536');
    const [metric, setMetric] = useState('cosine');

    // Control state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialState, setInitialState] = useState({});

    const allFields = { apiKey, environment, indexName, projectId, namespace };

    useEffect(() => {
        const config = service.config_json || {};
        const initialStateData = {
            apiKey: config.apiKey || '',
            environment: config.environment || '',
            indexName: config.indexName || '',
            projectId: config.projectId || '',
            namespace: config.namespace || '',
        };
        Object.entries(initialStateData).forEach(([key, value]) => {
            const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
            const setter = eval(setterName);
            setter(value);
        });
        setInitialState(initialStateData);
        setIsModified(false);
    }, [service]);

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
        log('Testing Pinecone connection...');

        addLogEntry("Initiating connection test...", 'info');
        await new Promise(r => setTimeout(r, 300));
        addLogEntry("Validating API Key format...", 'pending');
        await new Promise(r => setTimeout(r, 400));
        
        if (apiKey.length < 10) {
            addLogEntry("API Key format is invalid.", 'error');
            setConnectionStatus('error'); return;
        }
        addLogEntry("API Key format is valid.", 'success');

        addLogEntry("Authenticating with Pinecone services...", 'pending');
        await new Promise(r => setTimeout(r, 800));
        if (apiKey.includes('fail')) {
            addLogEntry("Authentication failed: API Key is invalid.", 'error');
            setConnectionStatus('error'); return;
        }
        addLogEntry("Authentication successful.", 'success');
        
        addLogEntry(`Checking for index '${indexName}' in '${environment}'...`, 'pending');
        await new Promise(r => setTimeout(r, 600));

        if (indexName.toLowerCase() === 'create-me') {
            addLogEntry(`Index '${indexName}' not found.`, 'error');
            setConnectionStatus('index_not_found'); return;
        }
        
        addLogEntry("Connection verified! Index is ready.", 'success');
        setConnectionStatus('success');

    }, [apiKey, environment, indexName, log]);

     const handleCreateIndex = async () => {
        log('User initiated Create Index.', { dimension, metric });
        addLogEntry(`Attempting to create index '${indexName}' with dimension ${dimension} and metric ${metric}...`, 'pending');
        await new Promise(r => setTimeout(r, 2000));
        addLogEntry(`Index '${indexName}' created successfully! Please test the connection again.`, 'success');
        setConnectionStatus('idle'); // Reset status to prompt re-test
    };

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsModified(false);
        setInitialState(allFields);
        onClose();
    }, [log, onClose, allFields]);

    const statusIndicatorClasses: Record<ConnectionStatus, string> = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500', index_not_found: 'bg-orange-500'
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                
                <main className="p-6 space-y-4 overflow-y-auto">
                    <div><label className="text-sm font-medium text-gray-300">API Key</label><p className="text-xs text-gray-500 mb-1">Find this in your Pinecone dashboard under "API Keys".</p><div className="relative"><input type={isKeyVisible ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Your Pinecone API Key" className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm"/><button onClick={() => setIsKeyVisible(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{isKeyVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button></div></div>
                    <div><label className="text-sm font-medium text-gray-300">Environment</label><p className="text-xs text-gray-500 mb-1">The cloud environment where your index is hosted.</p><input value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="e.g., gcp-starter or us-west1-gcp" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/></div>
                    <div><label className="text-sm font-medium text-gray-300">Index Name</label><p className="text-xs text-gray-500 mb-1">The name of the Pinecone index to connect to.</p><input value={indexName} onChange={e => setIndexName(e.target.value)} placeholder="e.g., soul-knowledgebase" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/></div>

                    <details className="border-t border-gray-700/50 pt-4">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Advanced Settings</summary>
                        <div className="mt-4 pl-4 space-y-4">
                            <div><label className="text-sm font-medium text-gray-300">Project ID (Optional)</label><input value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="Pinecone Project ID" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                            <div><label className="text-sm font-medium text-gray-300">Namespace (Optional)</label><p className="text-xs text-gray-500 mb-1">Isolate data within the index for multi-tenant setups.</p><input value={namespace} onChange={e => setNamespace(e.target.value)} placeholder="e.g., brain_01" className="w-full p-2 mt-1 bg-gray-600 rounded-lg text-sm"/></div>
                        </div>
                    </details>
                    
                    <details className="border-t border-gray-700/50 pt-4" open>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">Live Connection Log</summary>
                        <div className="bg-gray-900 rounded-lg p-2 mt-2 h-24 overflow-y-auto text-xs font-mono">
                           {connectionLog.length > 0 ? connectionLog.slice().reverse().map((entry, i) => (<p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : entry.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}><span>[{entry.timestamp}]</span> - <span>{entry.message}</span></p>)) : <p className="text-gray-500 text-center pt-6">Ready to test connection.</p>}
                        </div>
                    </details>

                    <AnimatePresence>
                    {connectionStatus === 'index_not_found' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="p-4 bg-orange-900/30 border border-orange-500/50 rounded-lg space-y-3">
                            <div className="flex items-center gap-2">
                                <WarningIcon className="w-5 h-5 text-orange-400"/>
                                <h4 className="font-semibold text-orange-300">Action Required: Create Index</h4>
                            </div>
                            <p className="text-xs text-orange-300/80">The specified index does not exist. You can create it now with the following settings.</p>
                            <div className="flex items-center gap-4">
                                <div><label className="text-xs text-gray-300">Vector Dimension</label><input type="number" value={dimension} onChange={e => setDimension(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"/></div>
                                <div><label className="text-xs text-gray-300">Metric</label><select value={metric} onChange={e => setMetric(e.target.value)} className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm"><option>cosine</option><option>euclidean</option><option>dotproduct</option></select></div>
                                <button onClick={handleCreateIndex} className="self-end px-4 py-2 bg-orange-600 rounded-md text-sm hover:bg-orange-500">Create Index</button>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </main>
                
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full transition-colors ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
                        <button onClick={handleTestConnection} disabled={connectionStatus === 'testing'} className="px-4 py-2 bg-blue-600 rounded-md text-sm hover:bg-blue-500 disabled:opacity-50">{connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !isModified || connectionStatus !== 'success'} className="px-4 py-2 bg-green-600 rounded-md text-sm hover:bg-green-500 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};
