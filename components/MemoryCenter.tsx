
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, LinkIcon } from './Icons'; // Assuming LinkIcon will be created
import dynamic from 'next/dynamic';

const EntityHub = dynamic(() => import('./hubs/EntityHub'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p>Loading Entity Hub...</p></div>
});


type Tab = 'entities' | 'relationships';

const MemoryCenter = () => {
    const [activeTab, setActiveTab] = useState<Tab>('entities');

    const TabButton = ({ tabName, label, icon: Icon }: { tabName: Tab; label: string, icon: React.FC<any> }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'entities': 
                return <EntityHub />;
            case 'relationships': 
                return (
                    <div className="p-8 text-center text-gray-400">
                        <h3 className="text-xl font-bold mb-4">Relationship Graph</h3>
                        <p>This section is under development.</p>
                        <p className="text-sm mt-2">A visual graph of entity relationships will be available here soon.</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Memory Center</h2>
            </div>
            
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <TabButton tabName="entities" label="Entities" icon={CubeIcon} />
                <TabButton tabName="relationships" label="Relationships" icon={LinkIcon} />
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default MemoryCenter;
