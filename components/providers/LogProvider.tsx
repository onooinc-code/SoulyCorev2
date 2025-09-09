
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

// Forcing a re-sync for GitHub.
export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loggingEnabled, setLoggingEnabled] = useState(true); // Default to on to capture initial logs

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

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const log = useCallback(async (message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') => {
        if (!loggingEnabled) {
            return;
        }

        // Optimistic update
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
            
            const savedLog = await res.json();
            // Replace optimistic log with the one from the DB to get the real ID and timestamp
            setLogs(prev => prev.map(l => l.id === tempId ? savedLog : l));

        } catch (error) {
            console.error("Failed to persist log:", error);
            // Revert optimistic update on failure
            setLogs(prev => prev.filter(l => l.id !== tempId));
        }
    }, [loggingEnabled]);

    const clearLogs = useCallback(async () => {
        const oldLogs = [...logs];
        setLogs([]); // Optimistic update

        try {
            const res = await fetch('/api/logs/all', { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to clear logs on the server.");
        } catch (error) {
            console.error(error);
            setLogs(oldLogs); // Revert on failure
        }
    }, [logs]);
    
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
