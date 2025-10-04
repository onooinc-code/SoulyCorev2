"use client";

import React from 'react';
import type { DataSource } from '@/lib/types/data';
import ServiceCard from './ServiceCard';
import StatsRow from './StatsRow';
import { 
    CircleStackIcon, BrainIcon, CloudIcon, CommandLineIcon, 
    WrenchScrewdriverIcon, ServerIcon 
} from '../Icons';

// Mock Data for Phase 1
const mockDataSources: DataSource[] = [
    { id: '1', name: 'Vercel Postgres', provider: 'Vercel', type: 'relational_db', status: 'connected', stats: [{ label: 'Tables', value: 21 }, { label: 'Latency', value: '12ms' }, {label: 'CPU', value: '5%'}, {label: 'Size', value: '1.2GB'}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '2', name: 'Pinecone KnowledgeBase', provider: 'Pinecone', type: 'vector', status: 'connected', stats: [{ label: 'Vectors', value: '1.2M' }, { label: 'Latency', value: '45ms' }, {label: 'Pods', value: 1}, {label: 'Reads/s', value: 15}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '3', name: 'Upstash Vector', provider: 'Vercel', type: 'vector', status: 'disconnected', stats: [{ label: 'Vectors', value: 0 }, { label: 'Latency', value: 'N/A' }, {label: 'Requests', value: 0}, {label: 'Size', value: '0MB'}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '4', name: 'Vercel KV', provider: 'Vercel', type: 'key_value', status: 'connected', stats: [{ label: 'Keys', value: 2387 }, { label: 'Latency', value: '4ms' }, {label: 'Hits', value: '98%'}, {label: 'Memory', value: '25MB'}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '5', name: 'Vercel Blob', provider: 'Vercel', type: 'blob', status: 'unstable', stats: [{ label: 'Files', value: 452 }, { label: 'Avg Size', value: '2.1MB' }, {label: 'Bandwidth', value: '15GB'}, {label: 'Errors', value: 3}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '6', name: 'Supabase', provider: 'Vercel', type: 'relational_db', status: 'needs_config', stats: [{ label: 'Tables', value: 0 }, { label: 'Latency', value: 'N/A' }, {label: 'Auth Users', value: 0}, {label: 'Storage', value: '0GB'}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '7', name: 'Self-Hosted MySQL', provider: 'CPanel', type: 'relational_db', status: 'error', stats: [{ label: 'DBs', value: 5 }, { label: 'Latency', value: '999ms' }, {label: 'Connections', value: 0}, {label: 'Status', value: 'Auth Error'}], createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '8', name: 'Google Drive', provider: 'Official', type: 'file_system', status: 'full', stats: [{ label: 'Files', value: '10k' }, { label: 'Size', value: '14.8GB' }, {label: 'Capacity', value: '15GB'}, {label: 'API Calls', value: 23}], createdAt: new Date(), lastUpdatedAt: new Date() },
];

const ServicesPanel = () => {
    return (
        <div className="space-y-6">
            <StatsRow services={mockDataSources} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mockDataSources.map(service => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </div>
        </div>
    );
};

export default ServicesPanel;
