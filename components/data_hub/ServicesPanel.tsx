
"use client";

import React from 'react';
import type { DataSource } from '@/lib/types/data';
import ServiceCard from './ServiceCard';
import StatsRow from './StatsRow';

interface ServicesPanelProps {
    services: DataSource[];
    onOpenSettings: (service: DataSource) => void;
}

const ServicesPanel = ({ services, onOpenSettings }: ServicesPanelProps) => {
    return (
        <div className="space-y-6">
            <StatsRow services={services} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {services.map(service => (
                    <ServiceCard key={service.id} service={service} onSettingsClick={() => onOpenSettings(service)} />
                ))}
            </div>
        </div>
    );
};

export default ServicesPanel;
