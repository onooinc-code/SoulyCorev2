// components/hubs/comm_hub/WebhookCreator.tsx
"use client";

import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from '@/components/Icons';

const WebhookCreator = () => {
    const [channel, setChannel] = useState('contact_form');
    const [copied, setCopied] = useState(false);

    const webhookUrl = `${window.location.origin}/api/webhooks/${channel}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg">
            <h4 className="text-lg font-bold mb-4">Create Webhook</h4>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="channel-select" className="block text-sm font-medium text-gray-400 mb-2">
                        Select Channel / Event Type
                    </label>
                    <select
                        id="channel-select"
                        value={channel}
                        onChange={e => setChannel(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                    >
                        <option value="contact_form">New Contact Form Submission</option>
                        <option value="user_signup">New User Signup</option>
                        <option value="external_event">Generic External Event</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Your Generated Webhook URL
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={webhookUrl}
                            readOnly
                            className="w-full p-2 pr-10 bg-gray-700 rounded-lg text-sm font-mono text-indigo-300"
                        />
                         <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                            {copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                 <p className="text-xs text-gray-500">
                    Send a POST request with a JSON body to this URL to trigger the corresponding event in SoulyCore.
                </p>
            </div>
        </div>
    );
};

export default WebhookCreator;
