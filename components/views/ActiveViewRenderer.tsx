"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '@/components/providers/UIStateProvider';

const componentMap = {
    dashboard: dynamic(() => import('@/components/dashboard/DashboardCenter')),
    search: dynamic(() => import('@/components/search/GlobalSearch')),
    agent_center: dynamic(() => import('@/components/agent_center/AgentCenter')),
    brain_center: dynamic(() => import('@/components/brain_center/BrainCenter')),
    memory_center: dynamic(() => import('@/components/MemoryCenter')),
    contacts_hub: dynamic(() => import('@/components/ContactsHub')),
    prompts_hub: dynamic(() => import('@/components/PromptsHub')),
    tools_hub: dynamic(() => import('@/components/ToolsHub')),
    tasks_hub: dynamic(() => import('@/components/TasksHub')),
    data_hub: dynamic(() => import('@/components/data_hub/DataHubCenter')),
    dev_center: dynamic(() => import('@/components/dev_center/DevCenter')),
    comm_hub: dynamic(() => import('@/components/hubs/CommunicationHub')),
    experiences_hub: dynamic(() => import('@/components/hubs/ExperiencesHub')),
};

const ActiveViewRenderer = () => {
    const { activeView } = useUIState();

    const ActiveComponent = componentMap[activeView] || null;

    return (
        <div className="w-full h-full bg-gray-900">
            {ActiveComponent ? <ActiveComponent /> : <div>View not found</div>}
        </div>
    );
};

export default ActiveViewRenderer;