
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { DataSource, DataSourceStatus, DataSourceType } from '@/lib/types';
import { DotsHorizontalIcon, ServerIcon, BrainIcon, CloudIcon, CircleStackIcon, WrenchScrewdriverIcon, CommandLineIcon } from '../Icons';

interface ServiceCardProps {
    service: DataSource;
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

const IconButton = ({ icon: Icon, title, active = false }: { icon: React.FC<any>; title: string; active?: boolean }) => (
    <button title={title} className={`w-full h-8 flex items-center justify-center rounded-md transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}>
        <Icon className="w-4 h-4" />
    </button>
);

const ServiceCard = ({ service }: ServiceCardProps) => {
    const TypeIcon = typeInfo[service.type]?.icon || CircleStackIcon;
    const TypeLabel = typeInfo[service.type]?.label || 'Data';
    const sInfo = statusInfo[service.status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
            className="bg-gray-800 rounded-lg border border-gray-700/80 p-3 flex flex-col gap-3"
        >
            {/* Header */}
            <div className="flex items-stretch gap-1">
                <button className="flex-shrink-0 w-1/5 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors" title={`Type: ${service.type}`}>
                    <TypeIcon className="w-5 h-5"/>
                </button>
                <div className="flex-grow w-3/5 bg-gray-900/50 rounded-md flex items-center justify-center text-center p-1">
                    <span className="font-bold text-sm truncate text-white">{service.name}</span>
                </div>
                <button className="flex-shrink-0 w-1/5 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors" title="Actions">
                    <DotsHorizontalIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {service.stats.map(stat => (
                    <div key={stat.label} className="bg-gray-900/50 p-1.5 rounded-md">
                        <p className="font-bold text-white text-base">{stat.value}</p>
                        <p className="text-gray-400 truncate">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Controls & Actions */}
            <div className="grid grid-cols-4 gap-2 text-xs">
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
                <IconButton icon={WrenchScrewdriverIcon} title="Settings" />
            </div>

        </motion.div>
    );
};

export default ServiceCard;