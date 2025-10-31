// components/hubs/comm_hub/ChannelDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { CommChannel } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, WarningIcon, RssIcon, CopyIcon } from '@/components/Icons';
import WebhookCreator from './WebhookCreator';
import BroadcastManager from './BroadcastManager';

// FIX: Extracted props to a dedicated interface to fix type error with `key` prop.
interface ChannelCardProps {
    channel: CommChannel & { incomingUrl?: string | null };
}

// FIX: Changed the ChannelCard component to be of type React.FC<ChannelCardProps> to correctly type it as a React functional component.
const ChannelCard: React.FC<ChannelCardProps> = ({ channel }) => {
    const [copiedOutgoing, setCopiedOutgoing] = useState(false);
    const [copiedIncoming, setCopiedIncoming] = useState(false);

    const statusMap: Record<CommChannel['status'], { color: string, icon: React.ReactNode, text: string }> = {
        active: { color: 'border-green-500', icon: <CheckIcon className="w-4 h-4 text-green-400"/>, text: 'Active' },
        inactive: { color: 'border-gray-500', icon: <XIcon className="w-4 h-4 text-gray-400"/>, text: 'Inactive' },
        error: { color: 'border-red-500', icon: <WarningIcon className="w-4 h-4 text-red-400"/>, text: 'Error' },
    };

    const currentStatus = statusMap[channel.status];
    const outgoingWebhookUrl = channel.configJson?.url;
    
    const handleCopy = (url: string, type: 'incoming' | 'outgoing') => {
        navigator.clipboard.writeText(url);
        if (type === 'incoming') {
            setCopiedIncoming(true);
            setTimeout(() => setCopiedIncoming(false), 2000);
        } else {
            setCopiedOutgoing(true);
            setTimeout(() => setCopiedOutgoing(false), 2000);
        }
    };

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
                <div className="mt-3 space-y-2">
                    {channel.incomingUrl && (
                         <div className="text-xs">
                            <label className="font-semibold text-gray-500">INCOMING URL</label>
                            <div className="relative bg-gray-900 p-2 rounded-md font-mono text-gray-400 truncate">
                                {channel.incomingUrl}
                                <button onClick={() => handleCopy(channel.incomingUrl!, 'incoming')} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white">
                                    {copiedIncoming ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                    {outgoingWebhookUrl && (
                        <div className="text-xs">
                            <label className="font-semibold text-gray-500">OUTGOING URL</label>
                            <div className="relative bg-gray-900 p-2 rounded-md font-mono text-gray-400 truncate">
                                {outgoingWebhookUrl}
                                <button onClick={() => handleCopy(outgoingWebhookUrl, 'outgoing')} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white">
                                    {copiedOutgoing ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const ChannelDashboard = () => {
    const { log } = useLog();
    const [channels, setChannels] = useState<(CommChannel & { incomingUrl?: string | null })[]>([]);
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