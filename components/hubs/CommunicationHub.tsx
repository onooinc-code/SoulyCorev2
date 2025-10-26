// components/hubs/CommunicationHub.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ChannelDashboard from './comm_hub/ChannelDashboard';
import UnifiedInbox from './comm_hub/UnifiedInbox';

type Tab = 'dashboard' | 'inbox' | 'templates';

const CommunicationHub = () => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    const TabButton = ({ tabName, label }: { tabName: Tab; label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
                activeTab === tabName 
                ? 'text-white' 
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
        >
            {label}
            {activeTab === tabName && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" layoutId="commHubTabIndicator" />
            )}
        </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': 
                return <ChannelDashboard />;
            case 'inbox':
                return <UnifiedInbox />;
            case 'templates':
                return <div className="text-center p-8 text-gray-500">Message Templates are planned for a future update.</div>;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Communication Hub</h2>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-shrink-0 border-b border-gray-800">
                <TabButton tabName="dashboard" label="Channel Dashboard" />
                <TabButton tabName="inbox" label="Unified Inbox" />
                <TabButton tabName="templates" label="Templates" />
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default CommunicationHub;