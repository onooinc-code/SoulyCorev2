// components/hubs/comm_hub/ChannelDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon, RssIcon, XIcon } from '@/components/Icons';
import { useLog } from '@/components/providers/LogProvider';
import type { CommChannel } from '@/lib/types';
import WebhookCreator from './WebhookCreator';

const ChannelDashboard = () => {
    const { log } = useLog();
    const [channels, setChannels] = useState<CommChannel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    const fetchChannels = useCallback(async () => {
        setIsLoading(true);
        log('Fetching communication channels...');
        try {
            const res = await fetch('/api/comm/channels');
            if (!res.ok) throw new Error('Failed to fetch channels');
            const data = await res.json();
            setChannels(data);
            log(`Fetched ${data.length} channels.`);
        } catch (error) {
            log('Failed to fetch channels', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);
    
    const statusInfo: Record<string, { color: string, pulse: boolean }> = {
        'active': { color: 'bg-green-500', pulse: false },
        'inactive': { color: 'bg-gray-500', pulse: false },
        'error': { color: 'bg-red-500', pulse: true },
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h3 className="text-lg font-bold">Configured Channels</h3>
                 <button 
                    onClick={() => setIsCreatorOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm"
                 >
                    <PlusIcon className="w-5 h-5" /> Add Channel
                 </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center"><p>Loading channels...</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {channels.map(channel => {
                        const sInfo = statusInfo[channel.status] || { color: 'bg-gray-500', pulse: false };
                        return (
                        <motion.div 
                            key={channel.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <RssIcon className="w-6 h-6 text-indigo-400" />
                                <div>
                                    <h4 className="font-semibold text-gray-200">{channel.name}</h4>
                                    <p className="text-xs text-gray-400">{channel.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`w-2.5 h-2.5 rounded-full ${sInfo.color} ${sInfo.pulse ? 'animate-pulse' : ''}`}></span>
                                    <span className="capitalize">{channel.status}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button aria-label={`Edit ${channel.name}`} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-4 h-4" /></button>
                                    <button aria-label={`Delete ${channel.name}`} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </motion.div>
                    )})}
                </div>
            )}
            
            <AnimatePresence>
                {isCreatorOpen && (
                    <WebhookCreator 
                        onClose={() => setIsCreatorOpen(false)} 
                        onSuccess={() => {
                            setIsCreatorOpen(false);
                            fetchChannels();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChannelDashboard;