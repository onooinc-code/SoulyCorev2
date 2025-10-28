"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { DataSource, DataSourceStatus, DataSourceType } from '@/lib/types';
import { DotsHorizontalIcon, ServerIcon, BrainIcon, CloudIcon, CircleStackIcon, WrenchScrewdriverIcon, CommandLineIcon } from '../Icons';

interface ServiceCardProps {
    service: DataSource;
    onSettingsClick: () => void;
}

const statusInfo: Record<DataSourceStatus, { color: string; pulse: boolean }> = {
    connected: { color: 'bg-green-500', pulse: false },
    disconnected: { color: 'bg-gray-500', pulse: false },
    error: { color: 'bg-red-500', pulse: true },
    needs_config: { color: 'bg-yellow-500', pulse: false },
    full: { color: 'bg-orange-500', pulse: false },
    unstable: { color: 'bg-yellow-400', pulse: true },
    unsupported: { color: 'bg-purple-500', pulse: false },
};

const typeInfo: Record<DataSourceType, { icon: React.FC<any>; label: string }> = {
    relational_db: { icon: ServerIcon, label: 'DB' },
    vector: { icon: BrainIcon, label: 'Vector' },
    blob: { icon: CloudIcon, label: 'Blob' },
    cache: { icon: CircleStackIcon, label: 'Cache' },
    document_db: { icon: ServerIcon, label: 'DocDB' },
    file_system: { icon: CloudIcon, label: 'FS' },
    graph: { icon: BrainIcon, label: 'Graph' },
    key_value: { icon: CircleStackIcon, label: 'KV' },
    object_storage: { icon: CloudIcon, label: 'Object' },
};

const IconButton = ({ icon: Icon, title, onClick, active = false }: { icon: React.FC<any>; title: string; onClick?: () => void; active?: boolean }) => (
    <button onClick={onClick} title={title} className={`w-full h-8 flex items-center justify-center rounded-md transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}>
        <Icon className="w-4 h-4" />
    </button>
);

// FIX: Changed the ServiceCard component to be of type React.FC<ServiceCardProps> to correctly type it as a React functional component. This resolves the TypeScript error where the 'key' prop, used in list rendering, was being incorrectly checked against the component's own props.
const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSettingsClick }) => {
    const TypeIcon = typeInfo[service.type]?.icon || CircleStackIcon;
    const sInfo = statusInfo[service.status];

    const displayStats = service.stats_json || [];
    const paddedStats = [...displayStats, ...Array(Math.max(0, 4 - displayStats.length)).fill({ label: '-', value: '-' })].slice(0, 4);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
            className="bg-gray-800 rounded-lg border border-gray-700/80 p-3 flex flex-col justify-between h-52"
        >
            <div className="flex flex-col gap-3 flex-grow">
                {/* Header */}
                <div className="flex items-stretch gap-1">
                    <button className="flex-shrink-0 w-1/5 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors" title={`Type: ${service.type}`}>
                        <TypeIcon className="w-5 h-5"/>
                    </button>
                    <div className="flex-grow w-3/5 bg-gray-900/50 rounded-md flex items-center justify-center text-center p-1">
                        <span className="font-bold text-sm truncate text-white">{service.name}</span>
                        {service.status === 'needs_config' && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400 border border-yellow-500/30">
                                MOCK
                            </span>
                        )}
                    </div>
                    <button className="flex-shrink-0 w-1/5 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors" title="Actions">
                        <DotsHorizontalIcon className="w-5 h-5"/>
                    </button>
                </div>
                
                {/* Conditional Stats/Message */}
                {service.status === 'connected' ? (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {paddedStats.map((stat, index) => (
                            <div key={`${stat.label}-${index}`} className="bg-gray-900/50 p-1.5 rounded-md flex flex-col justify-center">
                                <p className={`font-bold text-base truncate ${stat.value === '-' ? 'text-gray-600' : 'text-white'}`}>{stat.value}</p>
                                <p className="text-gray-400 truncate">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-2 bg-gray-900/50 rounded-md">
                        <WrenchScrewdriverIcon className="w-6 h-6 text-yellow-400 mb-1" />
                        <p className="text-xs font-semibold text-yellow-300">Configuration Required</p>
                        <p className="text-[10px] text-gray-500 mt-1">Click settings to connect</p>
                    </div>
                )}
            </div>

            {/* Controls & Actions */}
            <div className="grid grid-cols-4 gap-2 text-xs mt-3">
                {/* Row 1 */}
                <button title={`Status: ${service.status}`} className="w-full h-8 flex items-center justify-center rounded-md bg-gray-700/50">
                    <div className={`w-3 h-3 rounded-full ${sInfo.color} ${sInfo.pulse ? 'animate-pulse' : ''}`}></div>
                </button>
                <button title="Health Status" className="w-full h-8 flex items-center justify-center rounded-md bg-gray-700/50">
                     <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </button>
                 <button title="Enable/Disable" className="w-full h-8 flex items-center justify-center rounded-md bg-indigo-600 text-white">
                    <span className="font-bold">ON</span>
                </button>
                 <button title="Connect/Disconnect" className="w-full h-8 flex items-center justify-center rounded-md bg-indigo-600 text-white">
                    <span className="font-bold">CON</span>
                </button>
                
                {/* Row 2 */}
                <IconButton icon={CommandLineIcon} title="View Logs" />
                <IconButton icon={CircleStackIcon} title="Manage Data" />
                <IconButton icon={ServerIcon} title="Backup" />
                <IconButton icon={WrenchScrewdriverIcon} title="Settings" onClick={onSettingsClick} />
            </div>

        </motion.div>
    );
};

export default ServiceCard;