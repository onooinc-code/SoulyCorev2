"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon, UsersIcon, DocumentTextIcon } from '../Icons';
import AiContactExtractor from './memory_extraction/AiContactExtractor';
import ContactContactExtractor from './memory_extraction/ContactContactExtractor';
import DocumentExtractor from './memory_extraction/DocumentExtractor';

type Tab = 'ai-contact' | 'contact-contact' | 'document';

const MemoryExtractionHub = () => {
    const [activeTab, setActiveTab] = useState<Tab>('ai-contact');

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
            case 'ai-contact': 
                return <AiContactExtractor />;
            case 'contact-contact': 
                return <ContactContactExtractor />;
            case 'document':
                return <DocumentExtractor />;
            default: return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Memory Extraction Hub</h2>
            </div>
            
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <TabButton tabName="ai-contact" label="From AI-Contact Conversations" icon={ChatBubbleLeftRightIcon} />
                <TabButton tabName="contact-contact" label="From Contact-Contact Chat" icon={UsersIcon} />
                <TabButton tabName="document" label="From Documents" icon={DocumentTextIcon} />
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default MemoryExtractionHub;
