"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@/components/Icons';
import type { DataSource } from '@/lib/types';

export const PineconeModal = ({ service, onClose }: { service: DataSource, onClose: () => void }) => {
    const [apiKey, setApiKey] = useState('YOUR_PINECONE_API_KEY');
    const [environment, setEnvironment] = useState('gcp-starter');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const handleTest = () => {
        setTestStatus('testing');
        setTimeout(() => {
            setTestStatus(apiKey && environment ? 'success' : 'error');
            setTimeout(() => setTestStatus('idle'), 2000);
        }, 1000);
    };
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">Configure: {service.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                        <input type="password" id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                     <div>
                        <label htmlFor="environment" className="block text-sm font-medium text-gray-400 mb-1">Environment</label>
                        <input type="text" id="environment" value={environment} onChange={e => setEnvironment(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                </div>
                <div className="flex justify-between items-center gap-2 p-4 border-t border-gray-700">
                    <button onClick={handleTest} className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50" disabled={testStatus !== 'idle'}>
                        {testStatus === 'testing' && 'Testing...'}
                        {testStatus === 'success' && 'Success!'}
                        {testStatus === 'error' && 'Failed!'}
                        {testStatus === 'idle' && 'Test Connection'}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg text-sm hover:bg-gray-500">Cancel</button>
                        <button onClick={onClose} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500">Save Changes</button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
