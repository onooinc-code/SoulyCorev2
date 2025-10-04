
"use client";

import React from 'react';
import type { DataSource, DataSourceStatus } from '@/lib/types/data';
import { CheckIcon, XIcon, WarningIcon, CogIcon } from '../Icons';

interface StatsRowProps {
    services: DataSource[];
}

const StatCard = ({ title, value, icon, colorClass }: { title: string; value: number; icon: React.ReactNode; colorClass: string; }) => (
    <div className="bg-gray-800/50 p-3 rounded-lg flex items-center gap-3">
        <div className={`p-2 rounded-full bg-opacity-20 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{title}</div>
        </div>
    </div>
);

const StatsRow = ({ services }: StatsRowProps) => {
    const connected = services.filter(s => s.status === 'connected').length;
    const disconnected = services.filter(s => s.status === 'disconnected').length;
    const errors = services.filter(s => s.status === 'error' || s.status === 'unstable').length;
    const needsConfig = services.filter(s => s.status === 'needs_config').length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Connected" value={connected} icon={<CheckIcon className="w-5 h-5"/>} colorClass="bg-green-500 text-green-300" />
            <StatCard title="Disconnected" value={disconnected} icon={<XIcon className="w-5 h-5"/>} colorClass="bg-gray-500 text-gray-300" />
            <StatCard title="Errors / Unstable" value={errors} icon={<WarningIcon className="w-5 h-5"/>} colorClass="bg-red-500 text-red-300" />
            <StatCard title="Needs Config" value={needsConfig} icon={<CogIcon className="w-5 h-g"/>} colorClass="bg-yellow-500 text-yellow-300" />
        </div>
    );
};

export default StatsRow;