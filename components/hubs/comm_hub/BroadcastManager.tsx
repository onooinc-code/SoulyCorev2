// components/hubs/comm_hub/BroadcastManager.tsx
"use client";

import React, { useState } from 'react';

const BroadcastManager = () => {
    const [message, setMessage] = useState('');
    const [segment, setSegment] = useState('all');

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg h-full flex flex-col">
            <h4 className="text-lg font-bold mb-4">Send Broadcast</h4>
            <div className="flex-1 flex flex-col gap-4">
                <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Compose your message..."
                    className="w-full flex-1 p-2 bg-gray-700 rounded-lg text-sm resize-none"
                />
                <div className="flex items-center gap-4">
                    <label htmlFor="segment" className="text-sm text-gray-400">Target Segment:</label>
                    <select 
                        id="segment"
                        value={segment}
                        onChange={e => setSegment(e.target.value)}
                        className="p-2 bg-gray-700 rounded-lg text-sm"
                    >
                        <option value="all">All Users</option>
                        <option value="new">New Users (Last 7 Days)</option>
                        <option value="power">Power Users</option>
                    </select>
                </div>
            </div>
            <button 
                disabled
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
                Send Broadcast (Disabled)
            </button>
        </div>
    );
};

export default BroadcastManager;
