
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
            <span className="text-gray-500 flex-shrink-0 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <div className="flex-1 whitespace-pre-wrap break-words min-w-0">
                <p>
                    {log.message}
                    {conversationId && (
                         <span className="ml-2 text-[9px] text-indigo-400/70 font-mono border border-indigo-500/20 px-1 rounded">
                            CTX: {conversationId.substring(0, 5)}...
                         </span>
                    )}
                </p>
                {log.payload && (
                    <details className="mt-1 text-gray-500">
                        <summary className="cursor-pointer text-[10px] outline-none focus:underline hover:text-indigo-300">Payload</summary>
                        <pre className="text-[10px] bg-gray-900/50 p-2 rounded-md mt-1 overflow-auto max-h-40 border border-white/5">
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
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
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
        // Reverse logs for display (newest at bottom is standard for terminals, but here we render top-down list usually. 
        // Let's keep array order (newest first in state usually, so reverse to show history flow top-down)
        const sortedLogs = [...logs].reverse();

        const levelFiltered = filter === 'all'
            ? sortedLogs
            : sortedLogs.filter(log => log.level === filter);

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
        if (window.innerWidth < 1024) {
            setLogPanelOpen(false);
        }
    };

    const FilterButton = ({ level, label, count }: { level: FilterLevel, label: string, count: number }) => (
        <button
            onClick={() => setFilter(level)}
            className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded transition-colors ${filter === level ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            <span>{label}</span>
            <span className={`text-[10px] ${filter === level ? 'text-indigo-200' : 'text-gray-400'}`}>{count}</span>
        </button>
    );

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '300px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gray-950 border-t border-gray-700 flex flex-col shadow-inner z-50 relative font-mono"
        >
            <div className="flex justify-between items-center p-2 bg-gray-900 text-xs text-gray-300 gap-4 border-b border-gray-800">
                <div className="flex items-center gap-4 flex-grow">
                    <span className="flex-shrink-0 flex items-center gap-2 font-bold text-indigo-400">
                        <CommandLineIcon className="w-4 h-4"/> System Output
                    </span>
                     <div className="relative flex-grow max-w-xs">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Filter output..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-md pl-7 pr-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-300"
                        />
                    </div>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <FilterButton level="all" label="All" count={logCounts.all} />
                    <FilterButton level="info" label="Info" count={logCounts.info} />
                    <FilterButton level="warn" label="Warn" count={logCounts.warn} />
                    <FilterButton level="error" label="Error" count={logCounts.error} />
                     <div className="w-px h-4 bg-gray-700 mx-1"></div>
                     <button
                        onClick={() => setIsAutoScrollEnabled(prev => !prev)}
                        className={`px-2 py-0.5 text-[10px] rounded transition-colors ${isAutoScrollEnabled ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-gray-800 text-gray-500 border border-transparent'}`}
                    >
                        {isAutoScrollEnabled ? 'Auto-Scroll' : 'Manual'}
                    </button>
                    <button onClick={clearLogs} className="px-2 py-0.5 text-[10px] bg-gray-800 hover:bg-red-900/50 hover:text-red-300 text-gray-400 rounded transition-colors">Clear</button>
                </div>
            </div>
            <div ref={logContainerRef} className="flex-1 p-2 overflow-y-auto text-xs bg-black/40">
                {filteredLogs.length > 0 ? (
                     filteredLogs.map((log, index) => (
                        <LogEntry key={`${log.id}-${index}`} log={log} onJumpToChat={handleJumpToChat} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                         <CommandLineIcon className="w-8 h-8 opacity-20"/>
                        <p>System output is quiet.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default LogOutputPanel;
