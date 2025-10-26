
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLog } from './providers/LogProvider';
import { InfoIcon, WarningIcon, ErrorIcon, SearchIcon, CopyIcon, CheckIcon } from '@/components/Icons';
import { LogEntry as LogEntryType } from './providers/LogProvider';


interface LogOutputPanelProps {
    // isOpen prop is no longer needed as presence is controlled by the parent
}

type LogLevel = 'info' | 'warn' | 'error';
type FilterLevel = LogLevel | 'all';

// Component for rendering a single log entry
const LogEntry = ({ log }: { log: LogEntryType }) => {
    const [copied, setCopied] = useState(false);

    const levelIcon: Record<LogLevel, React.ReactNode> = {
        info: <InfoIcon className="w-4 h-4 text-gray-400" />,
        warn: <WarningIcon className="w-4 h-4 text-yellow-400" />,
        error: <ErrorIcon className="w-4 h-4 text-red-400" />,
    };

    const handleCopy = () => {
        const payloadString = log.payload ? `\n\nPayload:\n${JSON.stringify(log.payload, null, 2)}` : '';
        const textToCopy = `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}${payloadString}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative flex gap-3 items-start py-1.5 border-b border-gray-800/50 pr-8">
             <button 
                onClick={handleCopy} 
                className="absolute top-1 right-1 p-1 rounded-md bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-gray-600 hover:text-white"
                title="Copy log details"
            >
                {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
            </button>
            <span className="mt-0.5">{levelIcon[log.level as LogLevel]}</span>
            <span className="text-gray-500 flex-shrink-0">{new Date(log.timestamp).toISOString().slice(11, 23)}</span>
            <div className="flex-1 whitespace-pre-wrap break-words min-w-0">
                <p>{log.message}</p>
                {log.payload && (
                    <details className="mt-1 text-gray-500">
                        <summary className="cursor-pointer text-xs outline-none focus:underline">Payload</summary>
                        <pre className="text-xs bg-gray-800 p-2 rounded-md mt-1 overflow-auto">
                            <code>{JSON.stringify(log.payload, null, 2)}</code>
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};


const LogOutputPanel = (props: LogOutputPanelProps) => {
    const { logs, clearLogs } = useLog();
    const [filter, setFilter] = useState<FilterLevel>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Effect to handle auto-scrolling to the top when new logs arrive
    useEffect(() => {
        if (isAutoScrollEnabled && logContainerRef.current) {
            // New logs are prepended, so we scroll to the top to see the latest.
            logContainerRef.current.scrollTop = 0;
        }
    }, [logs, isAutoScrollEnabled]);

    const logCounts = useMemo(() => {
        return logs.reduce((acc, log) => {
            acc.all++;
            if (!acc[log.level]) acc[log.level] = 0;
            acc[log.level]++;
            return acc;
        }, { all: 0, info: 0, warn: 0, error: 0 } as Record<FilterLevel, number>);
    }, [logs]);

    const filteredLogs = useMemo(() => {
        const levelFiltered = filter === 'all'
            ? logs
            : logs.filter(log => log.level === filter);

        if (!searchTerm.trim()) {
            return levelFiltered;
        }

        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return levelFiltered.filter(log => {
            const messageMatch = log.message.toLowerCase().includes(lowercasedSearchTerm);
            const payloadMatch = log.payload 
                ? JSON.stringify(log.payload).toLowerCase().includes(lowercasedSearchTerm)
                : false;
            return messageMatch || payloadMatch;
        });
    }, [logs, filter, searchTerm]);

    const FilterButton = ({ level, label, count }: { level: FilterLevel, label: string, count: number }) => (
        <button
            onClick={() => setFilter(level)}
            className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded transition-colors ${filter === level ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
            <span>{label}</span>
            <span className={`text-xs ${filter === level ? 'text-indigo-200' : 'text-gray-400'}`}>{count}</span>
        </button>
    );

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '250px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gray-900 border-t border-gray-700 overflow-hidden flex flex-col"
        >
            <div className="flex justify-between items-center p-2 bg-gray-800 text-xs font-bold text-gray-300 gap-4">
                <div className="flex items-center gap-4 flex-grow">
                    <span className="flex-shrink-0">Log Output</span>
                     <div className="relative flex-grow max-w-xs">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 rounded-md pl-8 pr-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                 <div className="flex items-center gap-1.5 flex-shrink-0">
                    <FilterButton level="all" label="All" count={logCounts.all} />
                    <FilterButton level="info" label="Info" count={logCounts.info} />
                    <FilterButton level="warn" label="Warn" count={logCounts.warn} />
                    <FilterButton level="error" label="Error" count={logCounts.error} />
                     <button
                        onClick={() => setIsAutoScrollEnabled(prev => !prev)}
                        className={`ml-2 px-2 py-0.5 text-xs rounded transition-colors ${isAutoScrollEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                        title="Toggle auto-scrolling to the latest log"
                    >
                        Auto-Scroll: {isAutoScrollEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={clearLogs} className="px-2 py-0.5 text-xs bg-red-800 text-white rounded hover:bg-red-700">Clear</button>
                </div>
            </div>
            <div ref={logContainerRef} className="flex-1 p-2 overflow-y-auto text-xs font-mono">
                {filteredLogs.length > 0 ? (
                     filteredLogs.map((log, index) => (
                        <LogEntry key={`${log.id}-${index}`} log={log} />
                    ))
                ) : (
                    <p className="text-gray-500 text-center pt-4">No logs to display for this filter.</p>
                )}
            </div>
        </motion.div>
    );
};

export default LogOutputPanel;
