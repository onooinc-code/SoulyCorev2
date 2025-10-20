"use client";

// components/hubs/comm_hub/BroadcastManager.tsx
import React, { useState } from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';

const BroadcastManager = () => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { addNotification } = useNotification();

    const handleSend = () => {
        if (!message.trim()) return;
        setIsSending(true);
        console.log("Broadcasting message:", message);
        // Simulate API call
        setTimeout(() => {
            setIsSending(false);
            setMessage('');
            addNotification({
                type: 'success',
                title: 'Broadcast Sent',
                message: `Message sent to all clients: "${message.substring(0, 30)}..."`
            });
        }, 1000);
    };

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg">
            <h4 className="text-lg font-bold mb-4">Send App-Wide Broadcast</h4>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="broadcast-message" className="block text-sm font-medium text-gray-400 mb-2">
                        Broadcast Message
                    </label>
                    <textarea
                        id="broadcast-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="e.g., System will be down for maintenance at 2 AM EST."
                        className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                        rows={3}
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={isSending || !message.trim()}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-500 disabled:opacity-50"
                >
                    {isSending ? 'Sending...' : 'Send Broadcast'}
                </button>
            </div>
        </div>
    );
};

export default BroadcastManager;
