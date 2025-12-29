
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface LogEntry {
    id?: string;
    timestamp: string;
    message: string;
    payload?: any;
    level: 'info' | 'warn' | 'error';
}

interface LogContextType {
    logs: LogEntry[];
    log: (message: string, payload?: any, level?: 'info' | 'warn' | 'error') => void;
    clearLogs: () => void;
    setLoggingEnabled: (enabled: boolean) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loggingEnabled, setLoggingEnabled] = useState(true);

    const loadLogs = useCallback(async () => {
        try {
            const res = await fetch('/api/logs/all');
            if (!res.ok) throw new Error("Failed to fetch logs.");
            const fetchedLogs = await res.json();
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Failed to load logs:", error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    // Polling for live logs (background tasks)
    useEffect(() => {
        if (!loggingEnabled) return;
        const interval = setInterval(() => {
            loadLogs();
        }, 2500); // Poll every 2.5 seconds
        return () => clearInterval(interval);
    }, [loggingEnabled, loadLogs]);

    const log = useCallback(async (message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') => {
        if (!loggingEnabled) {
            return;
        }

        // Optimistic update for immediate feedback
        const tempId = crypto.randomUUID();
        const newLog: LogEntry = {
            id: tempId,
            timestamp: new Date().toISOString(),
            message,
            payload,
            level,
        };
        setLogs(prevLogs => [newLog, ...prevLogs]);

        // Persist to DB
        try {
            const res = await fetch('/api/logs/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, payload, level }),
            });
            if (!res.ok) throw new Error("Failed to save log.");
            
            // We don't replace here because the polling will catch up, 
            // and replacing might cause jitter if the ID changes.
        } catch (error) {
            console.error("Failed to persist log:", error);
        }
    }, [loggingEnabled]);

    const clearLogs = useCallback(async () => {
        setLogs([]); // Optimistic update

        try {
            const res = await fetch('/api/logs/all', { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to clear logs on the server.");
        } catch (error) {
            console.error(error);
            // Revert on failure (optional, but good practice)
            loadLogs();
        }
    }, [loadLogs]);
    
    return (
        <LogContext.Provider value={{ logs, log, clearLogs, setLoggingEnabled }}>
            {children}
        </LogContext.Provider>
    );
};

export const useLog = () => {
    const context = useContext(LogContext);
    if (context === undefined) {
        throw new Error('useLog must be used within a LogProvider');
    }
    return context;
};
