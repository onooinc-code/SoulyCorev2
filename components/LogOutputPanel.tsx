
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLog } from './providers/LogProvider';
import { useAppContext } from '@/lib/hooks/useAppContext';
import { InfoIcon, WarningIcon, ErrorIcon, SearchIcon, CopyIcon, CheckIcon, ChatBubbleLeftRightIcon, CommandLineIcon } from '@/components/Icons';
import { LogEntry as LogEntryType } from './providers/LogProvider';

interface LogOutputPanelProps {}

type LogLevel = 'info' | 'warn' | 'error';
type FilterLevel = LogLevel | 'all';

interface LogEntryProps {
    log: LogEntryType;
    onJumpToChat: (id: string) => void;
}

const LogEntry: React.FC<LogEntryProps> = ({ log, onJumpToChat }) => {
    const [copied, setCopied] = useState(false);
    const conversationId = log.payload?.conversationId;

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
             <div className="absolute top-1 right-1 flex gap-1">
                 {conversationId && (
                    <button 
                        onClick={() => onJumpToChat(conversationId)}
                        className="p-1 rounded-md bg-gray-700 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white"
                        title="Jump to Conversation"
                    >
                        <ChatBubbleLeftRightIcon className="w-3 h-3" />
                    </button>
                 )}
                 <button 
                    onClick={handleCopy} 
                    className="p-1 rounded-md bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600 hover:text-white"
                    title="Copy log details"
                >
                    {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
                </button>
            </div>
            <span className="mt-0.5">{levelIcon[log.level as LogLevel]}</span>
            <span className="text-gray-500 flex-shrink-0">{new Date(log.timestamp).toISOString().slice(11, 23)}</span>
            <div className="flex-1 whitespace-pre-wrap break-words min-w-0">
                <p>
                    {log.message}
                    {conversationId && (
                         <span className="ml-2 text-[10px] text-gray-600 font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                            CTX: {conversationId.substring(0, 6)}...
                         </span>
                    )}
                </p>
                {log.payload && (
                    <details className="mt-1 text-gray-500">
                        <summary className="cursor-pointer text-xs outline-none focus:underline">Payload</summary>
                        <pre className="text-xs bg-gray-800 p-2 rounded-md mt-1 overflow-auto max-h-60">
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
    const { setCurrentConversation, setActiveView, setLogPanelOpen } = useAppContext();
    
    const [filter, setFilter] = useState<FilterLevel>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAutoScrollEnabled && logContainerRef.current) {
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
    
    const handleJumpToChat = (id: string) => {
        setCurrentConversation(id);
        setActiveView('chat');
        // Optionally close the panel if on mobile, or keep open if debugging
        if (window.innerWidth < 1024) {
            setLogPanelOpen(false);
        }
    };

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
            animate={{ height: '350px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gray-900 border-t border-gray-700 overflow-hidden flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-50 relative"
        >
            <div className="flex justify-between items-center p-2 bg-gray-800 text-xs font-bold text-gray-300 gap-4">
                <div className="flex items-center gap-4 flex-grow">
                    <span className="flex-shrink-0 flex items-center gap-2">
                        <CommandLineIcon className="w-4 h-4 text-indigo-400"/> System Output
                    </span>
                     <div className="relative flex-grow max-w-xs">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter logs..."
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
                        {isAutoScrollEnabled ? 'Auto-Scroll: ON' : 'Scroll: OFF'}
                    </button>
                    <button onClick={clearLogs} className="px-2 py-0.5 text-xs bg-red-800 text-white rounded hover:bg-red-700">Clear</button>
                </div>
            </div>
            <div ref={logContainerRef} className="flex-1 p-2 overflow-y-auto text-xs font-mono bg-gray-950">
                {filteredLogs.length > 0 ? (
                     filteredLogs.map((log, index) => (
                        <LogEntry key={`${log.id}-${index}`} log={log} onJumpToChat={handleJumpToChat} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>No logs match the current filter.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default LogOutputPanel;
