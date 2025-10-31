"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApiEndpoint } from '@/lib/types';
import StatusIndicator from './StatusIndicator';
import { ServerIcon } from '@/components/Icons';

interface EndpointNavigatorPanelProps {
    endpoints: ApiEndpoint[];
    onSelectEndpoint: (endpoint: ApiEndpoint) => void;
    selectedEndpointId: string | null;
}

const EndpointNavigatorPanel = ({ endpoints, onSelectEndpoint, selectedEndpointId }: EndpointNavigatorPanelProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const groupedEndpoints = useMemo(() => {
        const filtered = endpoints.filter(e => 
            e.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // FIX: Corrected property name from group_name to groupName.
            e.groupName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups = filtered.reduce((acc, endpoint) => {
            // FIX: Corrected property name from group_name to groupName.
            (acc[endpoint.groupName] = acc[endpoint.groupName] || []).push(endpoint);
            return acc;
        }, {} as Record<string, ApiEndpoint[]>);

        // Initially expand all groups if not set
        if (Object.keys(expandedGroups).length === 0 && Object.keys(groups).length > 0) {
            const allExpanded = Object.keys(groups).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setExpandedGroups(allExpanded);
        }

        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [endpoints, searchTerm, expandedGroups]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };
    
    const methodColorMap: Record<string, string> = {
        'GET': 'text-green-400',
        'POST': 'text-blue-400',
        'PUT': 'text-yellow-400',
        'DELETE': 'text-red-400',
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-2">
                <input 
                    type="text"
                    placeholder="Filter endpoints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
                {groupedEndpoints.length > 0 ? (
                    groupedEndpoints.map(([groupName, groupEndpoints]) => (
                        <div key={groupName} className="py-1">
                            <button onClick={() => toggleGroup(groupName)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider hover:bg-gray-700/50 rounded">
                                <span>{groupName}</span>
                                <motion.span animate={{ rotate: expandedGroups[groupName] ? 90 : 0 }}>▶</motion.span>
                            </button>
                            <AnimatePresence>
                                {expandedGroups[groupName] && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-2 overflow-hidden">
                                        {groupEndpoints.map(endpoint => (
                                            <button
                                                key={endpoint.id}
                                                onClick={() => onSelectEndpoint(endpoint)}
                                                className={`w-full text-left p-2 my-0.5 rounded-md flex items-center gap-2 text-sm ${selectedEndpointId === endpoint.id ? 'bg-indigo-600/30' : 'hover:bg-gray-700/50'}`}
                                            >
                                                <StatusIndicator status={endpoint.lastTestStatus} />
                                                <span className={`font-mono font-semibold w-12 text-right ${methodColorMap[endpoint.method] || 'text-gray-400'}`}>{endpoint.method}</span>
                                                <span className="truncate">{endpoint.path}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-4 text-sm text-gray-500">No endpoints found.</div>
                )}
            </div>
        </div>
    );
};

export default EndpointNavigatorPanel;