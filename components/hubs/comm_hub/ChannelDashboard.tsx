// components/hubs/comm_hub/ChannelDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { CommChannel } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, WarningIcon, RssIcon } from '@/components/Icons';
import WebhookCreator from './WebhookCreator';
import BroadcastManager from './BroadcastManager';

const ChannelCard = ({ channel }: { channel: CommChannel }) => {
    const statusMap: Record<CommChannel['status'], { color: string, icon: React.ReactNode, text: string }> = {
        active: { color: 'border-green-500', icon: <CheckIcon className="w-4 h-4 text-green-400"/>, text: 'Active' },
        inactive: { color: 'border-gray-500', icon: <XIcon className="w-4 h-4 text-gray-400"/>, text: 'Inactive' },
        error: { color: 'border-red-500', icon: <WarningIcon className="w-4 h-4 text-red-400"/>, text: 'Error' },
    };

    const currentStatus = statusMap[channel.status];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gray-800 p-4 rounded-lg border-l-4 ${currentStatus.color}`}
        >
            <h4 className="font-bold text-gray-200">{channel.name}</h4>
            <p className="text-xs text-gray-400 capitalize">{channel.type.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-2 mt-3 text-xs">
                {currentStatus.icon}
                <span>{currentStatus.text}</span>
            </div>
             {channel.type === 'webhook' && (
                <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-900 p-2 rounded-md">
                    POST /api/webhooks/{channel.id}
                </div>
            )}
        </motion.div>
    );
};

const ChannelDashboard = () => {
    const { log } = useLog();
    const [channels, setChannels] = useState<CommChannel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchChannels = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/comm/channels');
            if (!res.ok) throw new Error("Failed to fetch channels");
            const data = await res.json();
            setChannels(data);
        } catch (error) {
            log('Error fetching comm channels', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Panel: Channel List */}
            <div className="lg:col-span-1 h-full flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Active Channels</h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {isLoading ? <p>Loading channels...</p> : channels.length > 0 ? (
                        <AnimatePresence>
                            {channels.map(channel => (
                                <ChannelCard key={channel.id} channel={channel} />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center text-gray-500 py-16 border-2 border-dashed border-gray-700 rounded-lg">
                            <RssIcon className="w-12 h-12 mx-auto mb-4"/>
                            <h4 className="font-semibold">No Channels Created</h4>
                            <p className="text-sm">Use the form to create your first communication channel.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Tools */}
            <div className="lg:col-span-2 h-full grid grid-rows-2 gap-6">
                 <WebhookCreator onCreationSuccess={fetchChannels} />
                 <BroadcastManager />
            </div>
        </div>
    );
};

export default ChannelDashboard;
