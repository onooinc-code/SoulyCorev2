// components/hubs/comm_hub/UnifiedInbox.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Log } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { motion } from 'framer-motion';

const UnifiedInbox = () => {
  const [messages, setMessages] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { log: appLog } = useLog(); // Renaming to avoid conflict

  const fetchInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/comm/inbox');
      if (!res.ok) throw new Error('Failed to fetch inbox');
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      appLog('Failed to fetch inbox', { error: e }, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [appLog]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  if (isLoading) return <p className="text-center p-8">Loading inbox messages...</p>;

  return (
    <div className="space-y-3">
      {messages.length > 0 ? messages.map(msg => (
        <motion.div key={msg.id} className="bg-gray-900/50 p-3 rounded-lg">
          <p className="text-sm text-gray-300">{msg.message}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
          {msg.payload && (
            <details className="text-xs mt-2">
              <summary className="cursor-pointer text-gray-400">View Payload</summary>
              <pre className="bg-gray-700 p-2 rounded mt-1 max-h-48 overflow-auto"><code>{JSON.stringify(msg.payload, null, 2)}</code></pre>
            </details>
          )}
        </motion.div>
      )) : <p className="text-center text-gray-500 p-8">Inbox is empty.</p>}
    </div>
  );
};

export default UnifiedInbox;
