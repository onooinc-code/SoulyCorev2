
"use client";

import React from 'react';
import { useUIState } from '../providers/UIStateProvider';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import heavy components to improve initial load time
const DashboardCenter = dynamic(() => import('../dashboard/DashboardCenter'));
const AgentCenter = dynamic(() => import('../agent_center/AgentCenter'));
const BrainCenter = dynamic(() => import('../brain_center/BrainCenter'));
const MemoryCenter = dynamic(() => import('../MemoryCenter'));
const ContactsHub = dynamic(() => import('../ContactsHub'));
const PromptsHub = dynamic(() => import('../PromptsHub'));
const ToolsHub = dynamic(() => import('../ToolsHub'));
const TasksHub = dynamic(() => import('../TasksHub'));
const DataHubCenter = dynamic(() => import('../data_hub/DataHubCenter'));
const DevCenter = dynamic(() => import('../dev_center/DevCenter'));

const viewMap: { [key: string]: React.ComponentType } = {
    dashboard: DashboardCenter,
    agent_center: AgentCenter,
    brain_center: BrainCenter,
    memory_center: MemoryCenter,
    contacts_hub: ContactsHub,
    prompts_hub: PromptsHub,
    tools_hub: ToolsHub,
    tasks_hub: TasksHub,
    data_hub: DataHubCenter,
    dev_center: DevCenter,
};

const ActiveViewRenderer = () => {
    const { activeView } = useUIState();

    const ActiveComponent = viewMap[activeView] || null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
            >
                {ActiveComponent ? <ActiveComponent /> : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Select a view from the navigation rail.</p>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ActiveViewRenderer;
