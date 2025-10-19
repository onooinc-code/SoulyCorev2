// components/views/ActiveViewRenderer.tsx
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '@/components/providers/UIStateProvider';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import all the hub/view components
const DashboardCenter = dynamic(() => import('../dashboard/DashboardCenter'));
const GlobalSearch = dynamic(() => import('../search/GlobalSearch'));
const AgentCenter = dynamic(() => import('../agent_center/AgentCenter'));
const BrainCenter = dynamic(() => import('../brain_center/BrainCenter'));
const MemoryCenter = dynamic(() => import('../MemoryCenter'));
const ContactsHub = dynamic(() => import('../ContactsHub'));
const PromptsHub = dynamic(() => import('../PromptsHub'));
const ToolsHub = dynamic(() => import('../ToolsHub'));
const TasksHub = dynamic(() => import('../TasksHub'));
const DataHubCenter = dynamic(() => import('../data_hub/DataHubCenter'));
const DevCenter = dynamic(() => import('../dev_center/DevCenter'));
const CommunicationHub = dynamic(() => import('../hubs/CommunicationHub'));

const viewMap = {
    dashboard: DashboardCenter,
    search: GlobalSearch,
    agent_center: AgentCenter,
    brain_center: BrainCenter,
    memory_center: MemoryCenter,
    contacts_hub: ContactsHub,
    prompts_hub: PromptsHub,
    tools_hub: ToolsHub,
    tasks_hub: TasksHub,
    data_hub: DataHubCenter,
    dev_center: DevCenter,
    comm_hub: CommunicationHub,
};

const ActiveViewRenderer = () => {
    const { activeView } = useUIState();

    const ComponentToRender = viewMap[activeView as keyof typeof viewMap] || null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
            >
                {ComponentToRender ? <ComponentToRender /> : null}
            </motion.div>
        </AnimatePresence>
    );
};

export default ActiveViewRenderer;
