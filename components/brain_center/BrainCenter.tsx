
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Squares2X2Icon, CogIcon, ViewColumnsIcon } from '../Icons';

const BrainManagementTab = dynamic(() => import('./BrainManagementTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading Management...</p></div>
});

const MemoryViewerTab = dynamic(() => import('./MemoryViewerTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading Viewer...</p></div>
});

const BrainVisualizerTab = dynamic(() => import('./BrainVisualizerTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading Visualizer...</p></div>
});

type Tab = 'brain_management' | 'memory_viewer' | 'analytics';

const BrainCenter = () => {
    const [activeTab, setActiveTab] = useState<Tab>('brain_management');

    const TabButton = ({ tabName, label, icon: Icon }: { tabName: Tab; label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tabName ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'brain_management': return <BrainManagementTab />;
            case 'memory_viewer': return <MemoryViewerTab />;
            case 'analytics': return <BrainVisualizerTab />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Brain Center</h2>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <TabButton tabName="brain_management" label="Configuration" icon={CogIcon} />
                <TabButton tabName="memory_viewer" label="Raw Explorer" icon={ViewColumnsIcon} />
                <TabButton tabName="analytics" label="Brain Analytics" icon={Squares2X2Icon} />
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-xl p-4 overflow-y-auto min-h-0 border border-white/5">
                {renderContent()}
            </div>
        </div>
    );
};

export default BrainCenter;
