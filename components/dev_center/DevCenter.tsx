"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import Dashboard from './Dashboard';
import Roadmap from './Roadmap';
import Documentation from './Documentation';
import dynamic from 'next/dynamic';

const FeaturesDictionary = dynamic(() => import('./FeaturesDictionary'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading Features Dictionary...</p></div>
});

const FeatureHealthDashboard = dynamic(() => import('./FeatureHealthDashboard'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading Health Dashboard...</p></div>
});

const APICommandCenterTab = dynamic(() => import('./api_command_center/APICommandCenterTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading API Command Center...</p></div>
});


type Tab = 'api' | 'health' | 'features' | 'dashboard' | 'roadmap' | 'docs';

const DevCenter = () => {
    const [activeTab, setActiveTab] = useState<Tab>('api');

    const TabButton = ({ tabName, label }: { tabName: Tab; label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'api': return <APICommandCenterTab />;
            case 'health': return <FeatureHealthDashboard />;
            case 'features': return <FeaturesDictionary />;
            case 'dashboard': return <Dashboard />;
            case 'roadmap': return <Roadmap />;
            case 'docs': return <Documentation />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">SoulyDev Center</h2>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <TabButton tabName="api" label="API Command Center" />
                <TabButton tabName="health" label="Feature Health" />
                <TabButton tabName="features" label="Features Dictionary" />
                <TabButton tabName="dashboard" label="Dashboard" />
                <TabButton tabName="roadmap" label="Roadmap & Ideas" />
                <TabButton tabName="docs" label="Smart Documentation" />
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default DevCenter;