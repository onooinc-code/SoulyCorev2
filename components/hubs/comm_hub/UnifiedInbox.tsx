// components/hubs/comm_hub/UnifiedInbox.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Log } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { RssIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const InboxItem = ({ item }: { item: Log }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 p-4 rounded-lg"
        >
            <p className="text-sm font-semibold">{item.message}</p>
            <p className="text-xs text-gray-500 mb-2">{new Date(item.timestamp).toLocaleString()}</p>
            <details className="text-xs">
                <summary className="cursor-pointer text-gray-400">View Payload</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-800 rounded-md overflow-auto">
                    <code>{JSON.stringify(item.payload, null, 2)}</code>
                </pre>
            </details>
        </motion.div>
    );
};

const UnifiedInbox = () => {
    const { log } = useLog();
    const [messages, setMessages] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInbox = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/comm/inbox');
            if (!res.ok) throw new Error("Failed to fetch inbox messages");
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            log('Error fetching inbox', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Unified Inbox</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {isLoading ? (
                    <p>Loading inbox...</p>
                ) : messages.length > 0 ? (
                    <AnimatePresence>
                        {messages.map(msg => (
                            <InboxItem key={msg.id} item={msg} />
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center text-gray-500 py-16 border-2 border-dashed border-gray-700 rounded-lg">
                        <RssIcon className="w-12 h-12 mx-auto mb-4"/>
                        <h4 className="font-semibold">Inbox is Empty</h4>
                        <p className="text-sm">Incoming messages from your channels will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnifiedInbox;