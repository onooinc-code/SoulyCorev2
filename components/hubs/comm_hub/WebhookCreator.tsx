// components/hubs/comm_hub/WebhookCreator.tsx
"use client";

import React, { useState } from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';

interface WebhookCreatorProps {
    onCreationSuccess: () => void;
}

const WebhookCreator = ({ onCreationSuccess }: WebhookCreatorProps) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('webhook');
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();

    const handleCreate = async () => {
        if (!name.trim()) {
            addNotification({ type: 'warning', title: 'Name is required' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/comm/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create channel');
            }
            addNotification({ type: 'success', title: 'Channel Created', message: `Channel "${name}" is now active.` });
            onCreationSuccess();
            // Reset form
            setName('');
        } catch (error) {
            addNotification({ type: 'error', title: 'Creation Failed', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg h-full flex flex-col">
            <h4 className="text-lg font-bold mb-4">Create New Channel</h4>
            <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Channel Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g., Website Contact Form"
                        className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Channel Type
                    </label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                    >
                        <option value="webhook">Inbound Webhook</option>
                        <option value="email_inbound">Inbound Email (Not Implemented)</option>
                        <option value="app_broadcast">App Broadcast (Internal)</option>
                    </select>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50"
                >
                    {isLoading ? 'Creating...' : 'Create Channel'}
                </button>
            </div>
        </div>
    );
};

export default WebhookCreator;
