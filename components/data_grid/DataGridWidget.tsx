"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CircleStackIcon, ServerIcon, CloudIcon, BrainIcon } from '../Icons';
import type { DataSource, DataSourceStatus, DataSourceType } from '@/lib/types';

interface DataGridWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

const statusColors: Record<DataSourceStatus, string> = {
    connected: 'bg-green-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
    needs_config: 'bg-yellow-500',
    full: 'bg-orange-500',
    unstable: 'bg-yellow-400 animate-pulse',
    unsupported: 'bg-purple-500',
};

const typeIcons: Record<DataSourceType, React.FC<any>> = {
    relational_db: ServerIcon,
    vector: BrainIcon,
    blob: CloudIcon,
    cache: CircleStackIcon,
    document_db: CircleStackIcon,
    file_system: CloudIcon,
    graph: CircleStackIcon,
    key_value: CircleStackIcon,
    object_storage: CloudIcon,
};

// Mock data, same as in ServicesPanel. In a real app, this would be fetched.
const mockDataSources: DataSource[] = [
    { id: '1', name: 'Vercel Postgres', provider: 'Vercel', type: 'relational_db', status: 'connected', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '2', name: 'Pinecone KB', provider: 'Pinecone', type: 'vector', status: 'connected', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '3', name: 'Upstash Vector', provider: 'Vercel', type: 'vector', status: 'disconnected', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '4', name: 'Vercel KV', provider: 'Vercel', type: 'key_value', status: 'connected', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '5', name: 'Vercel Blob', provider: 'Vercel', type: 'blob', status: 'unstable', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '6', name: 'Supabase', provider: 'Vercel', type: 'relational_db', status: 'needs_config', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '7', name: 'Self-Hosted MySQL', provider: 'CPanel', type: 'relational_db', status: 'error', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '8', name: 'Google Drive', provider: 'Official', type: 'file_system', status: 'full', stats: [], createdAt: new Date(), lastUpdatedAt: new Date() },
];


const DataGridWidget = ({ isOpen, onClose }: DataGridWidgetProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-xl w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-lg font-bold">Data Grid Status</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                        </header>
                        <main className="p-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {mockDataSources.map(service => {
                                    const Icon = typeIcons[service.type] || CircleStackIcon;
                                    return (
                                        <div key={service.id} className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
                                            <div className="relative">
                                                <Icon className="w-6 h-6 text-gray-300" />
                                                <span className={`absolute -bottom-1 -right-1 block h-3 w-3 rounded-full border-2 border-gray-900/50 ${statusColors[service.status]}`} title={service.status}></span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold truncate">{service.name}</p>
                                                <p className="text-xs text-gray-400">{service.provider}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DataGridWidget;
