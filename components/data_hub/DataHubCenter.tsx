
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ServicesPanel from './ServicesPanel';
import LogsPanel from './LogsPanel';
import type { DataSource } from '@/lib/types';
import DataSourceSettingsModal from './DataSourceSettingsModal';
import { useLog } from '../providers/LogProvider';

type Tab = 'services' | 'logs';

const DataHubCenter = () => {
    const { log } = useLog();
    const [activeTab, setActiveTab] = useState<Tab>('services');
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [settingsModalState, setSettingsModalState] = useState<{
        isOpen: boolean;
        service: DataSource | null;
    }>({ isOpen: false, service: null });

    const fetchDataSources = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        log('Fetching data sources for Data Hub...');
        try {
            const res = await fetch('/api/data-sources');
            if (!res.ok) throw new Error('Failed to fetch data sources');
            const data = await res.json();
            setDataSources(data);
            log(`Successfully fetched ${data.length} data sources.`);
        } catch (err) {
            const errorMessage = (err as Error).message;
            setError(errorMessage);
            log('Failed to fetch data sources.', { error: errorMessage }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchDataSources();
    }, [fetchDataSources]);

    const handleOpenSettings = (service: DataSource) => {
        log(`Opening settings for ${service.name}`);
        setSettingsModalState({ isOpen: true, service });
    };

    const handleCloseSettings = () => {
        log('Closing settings modal.');
        setSettingsModalState({ isOpen: false, service: null });
    };

    const handleSaveSuccess = () => {
        handleCloseSettings();
        fetchDataSources(); // Refresh the data after a successful save
    };

    const TabButton = ({ tabName, label }: { tabName: Tab; label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors relative ${
                activeTab === tabName 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:bg-gray-800/50'
            }`}
        >
            {label}
            {activeTab === tabName && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" layoutId="dataHubTab" />
            )}
        </button>
    );
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center text-gray-400 p-8">Loading data sources...</div>;
        }
        if (error) {
            return <div className="text-center text-red-400 p-8">Error: {error}</div>;
        }

        switch (activeTab) {
            case 'services': return <ServicesPanel services={dataSources} onOpenSettings={handleOpenSettings} />;
            case 'logs': return <LogsPanel />;
            default: return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-900">
            <header className="flex-shrink-0 p-4">
                 <div className="relative w-full h-24 rounded-lg overflow-hidden border border-indigo-500/30 p-4 flex items-center justify-between">
                    <div className="absolute inset-0 bg-gray-900/50">
                        <style>{`
                            @keyframes animated-grid { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
                            .animated-grid-bg-datahub {
                                background-image: linear-gradient(to right, rgba(79, 70, 229, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 70, 229, 0.2) 1px, transparent 1px);
                                background-size: 40px 40px;
                                animation: animated-grid 4s linear infinite;
                            }
                        `}</style>
                        <div className="absolute inset-0 animated-grid-bg-datahub"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900"></div>
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold text-white">Data Hub</h1>
                        <p className="text-sm text-gray-400">Monitor and manage all data sources & storage services.</p>
                    </div>
                     <div className="relative z-10">
                    </div>
                </div>
            </header>
            
            <nav className="flex-shrink-0 px-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <TabButton tabName="services" label="Manage Data Sources" />
                    <TabButton tabName="logs" label="Global Logs" />
                </div>
            </nav>

            <main className="flex-1 p-4 overflow-y-auto min-h-0">
                {renderContent()}
            </main>

            <DataSourceSettingsModal
                isOpen={settingsModalState.isOpen}
                onClose={handleCloseSettings}
                service={settingsModalState.service}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
};