"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@/components/Icons';
import dynamic from 'next/dynamic';

const BrainManagementTab = dynamic(() => import('./BrainManagementTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading...</p></div>
});

const MemoryViewerTab = dynamic(() => import('./MemoryViewerTab'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white">Loading...</p></div>
});

type Tab = 'brain_management' | 'memory_viewer';

const BrainCenter = () => {
    const [activeTab, setActiveTab] = useState<Tab>('brain_management');

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
            case 'brain_management': return <BrainManagementTab />;
            case 'memory_viewer': return <MemoryViewerTab />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Brain Center</h2>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <TabButton tabName="brain_management" label="Brain Management" />
                <TabButton tabName="memory_viewer" label="Memory Viewer" />
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default BrainCenter;