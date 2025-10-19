"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '../../Icons';
import type { DataSource } from '@/lib/types';
import { useDataSourceSettings } from '@/lib/hooks/use-data-source-settings';

interface ModalProps {
    service: DataSource;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const VercelRedisModal = ({ service, onClose, onSaveSuccess }: ModalProps) => {
    const {
        config,
        handleConfigChange,
        isSaving,
        isModified,
        handleSave,
        connectionStatus,
        handleTestConnection,
        connectionLog,
        isLoading,
    } = useDataSourceSettings(service, onSaveSuccess);

    const [isTokenVisible, setIsTokenVisible] = useState(false);

    if (isLoading) {
        return <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101]"><p>Loading...</p></div>;
    }

    const statusIndicatorClasses: Record<string, string> = {
        idle: 'bg-gray-500', testing: 'bg-yellow-400 animate-pulse', success: 'bg-green-500', error: 'bg-red-500'
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-white/10"><h2 className="font-semibold text-lg">{service.name} Settings</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button></header>
                <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-300">REDIS_URL</label>
                        <p className="text-xs text-gray-500 mb-2">Your Vercel Redis connection URL.</p>
                        <input type="text" value={config.url || ''} onChange={e => handleConfigChange('url', e.target.value)} placeholder="redis://..." className="w-full p-2 mt-1 bg-gray-700 rounded-lg text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">REDIS_REST_API_TOKEN</label>
                        <p className="text-xs text-gray-500 mb-2">Your Vercel Redis REST API Token.</p>
                        <div className="relative mt-1">
                            <input type={isTokenVisible ? 'text' : 'password'} value={config.token || ''} onChange={e => handleConfigChange('token', e.target.value)} placeholder="Your Redis REST API Token" className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm" />
                            <button onClick={() => setIsTokenVisible(!isTokenVisible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{isTokenVisible ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5" />}</button>
                        </div>
                    </div>
                     <div className="border-t border-gray-700/50 pt-4">
                         <h4 className="text-sm font-medium text-gray-300 mb-2">Connection Log</h4>
                         <div className="bg-gray-900 rounded-lg p-2 h-24 overflow-y-auto text-xs font-mono">
                            {connectionLog.length > 0 ? connectionLog.map((entry, i) => (<p key={i} className={`flex items-start gap-2 ${entry.status === 'success' ? 'text-green-400' : 'text-red-400'}`}><span>[{entry.timestamp}]</span> - <span>{entry.message}</span></p>)) : <p className="text-gray-500 text-center pt-6">Ready to test connection.</p>}
                         </div>
                     </div>
                </main>
                <footer className="flex justify-between items-center gap-2 p-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                         <div className={`w-4 h-4 rounded-full ${statusIndicatorClasses[connectionStatus]}`} title={`Status: ${connectionStatus}`}></div>
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
