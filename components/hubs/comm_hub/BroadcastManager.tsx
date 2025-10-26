// components/hubs/comm_hub/BroadcastManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';
import type { CommChannel } from '@/lib/types';

const BroadcastManager = () => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { addNotification } = useNotification();
    const [channels, setChannels] = useState<CommChannel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('broadcast');

    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch('/api/comm/channels');
            if (res.ok) {
                const data = await res.json();
                // Filter for webhook types to send notifications
                setChannels(data.filter((c: CommChannel) => c.type === 'webhook'));
            }
        } catch (error) {
            // silent fail, not critical for this component
            console.error("Failed to fetch channels for broadcast manager", error);
        }
    }, []);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        
        const isBroadcast = selectedChannelId === 'broadcast';
        const url = isBroadcast ? '/api/comm/broadcast' : `/api/comm/notify/${selectedChannelId}`;
        const body = { message };
        
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            
            setIsSending(false);
            setMessage('');
            addNotification({
                type: 'success',
                title: isBroadcast ? 'Broadcast Sent' : 'Notification Sent',
                message: data.message
            });
        } catch (error) {
            setIsSending(false);
            addNotification({
                type: 'error',
                title: isBroadcast ? 'Broadcast Failed' : 'Send Failed',
                message: (error as Error).message
            });
        }
    };

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg h-full flex flex-col">
            <h4 className="text-lg font-bold mb-4">Send Notification</h4>
            <div className="space-y-4 flex-1 flex flex-col">
                 <div>
                    <label htmlFor="notification-channel" className="block text-sm font-medium text-gray-400 mb-2">
                        Target Channel
                    </label>
                    <select
                        id="notification-channel"
                        value={selectedChannelId}
                        onChange={e => setSelectedChannelId(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                    >
                        <option value="broadcast">App-Wide Broadcast</option>
                        {channels.map(channel => (
                            <option key={channel.id} value={channel.id}>
                                {channel.name} (Webhook)
                            </option>
                        ))}
                    </select>
                </div>
                 <div className="flex-1 flex flex-col">
                    <label htmlFor="broadcast-message" className="block text-sm font-medium text-gray-400 mb-2">
                        Message
                    </label>
                    <textarea
                        id="broadcast-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="e.g., System will be down for maintenance at 2 AM EST."
                        className="w-full flex-1 p-2 bg-gray-700 rounded-lg text-sm resize-none"
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={isSending || !message.trim()}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-500 disabled:opacity-50"
                >
                    {isSending ? 'Sending...' : 'Send Notification'}
                </button>
            </div>
        </div>
    );
};

export default BroadcastManager;