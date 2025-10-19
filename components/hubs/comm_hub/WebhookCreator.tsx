// components/hubs/comm_hub/WebhookCreator.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CopyIcon, CheckIcon } from '@/components/Icons';

interface WebhookCreatorProps {
    onClose: () => void;
    onSuccess: () => void;
}

const WebhookCreator = ({ onClose, onSuccess }: WebhookCreatorProps) => {
    const [step, setStep] = useState(1);
    const [channelName, setChannelName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        setIsLoading(true);
        // This is a mock implementation
        await new Promise(res => setTimeout(res, 1000));
        setWebhookUrl(`https://soulycore.app/api/webhooks/${crypto.randomUUID()}`);
        setIsLoading(false);
        setStep(2);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-lg">Create New Webhook Channel</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">Give your new webhook a name to identify it.</p>
                            <input 
                                value={channelName}
                                onChange={e => setChannelName(e.target.value)}
                                placeholder="e.g., 'Website Contact Form'"
                                className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                                <button onClick={handleCreate} disabled={!channelName.trim() || isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500 disabled:opacity-50">
                                    {isLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-4">
                            <p className="text-sm text-gray-300">Your webhook has been created. Use this URL in your external service to send data to SoulyCore.</p>
                             <div className="relative">
                                <input 
                                    type="text"
                                    value={webhookUrl}
                                    readOnly
                                    className="w-full p-2 pr-10 bg-gray-900 rounded-lg text-sm font-mono text-indigo-300"
                                />
                                <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    {copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Next steps: Send a test request to this URL, then use the Visual Payload Mapper to map the data fields.</p>
                             <div className="flex justify-end">
                                <button onClick={onSuccess} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Done</button>
                            </div>
                         </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WebhookCreator;
