// components/NavigationRail.tsx
"use client";

import React from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { 
    DashboardIcon, 
    RocketLaunchIcon, 
    BrainIcon, 
    MemoryIcon, 
    UsersIcon, 
    PromptsIcon,
    ToolsIcon,
    CircleStackIcon,
    CodeIcon,
    ChatBubbleLeftRightIcon,
    SearchIcon,
    ClipboardDocumentListIcon, // Changed from TasksIcon
    RssIcon,
    LightbulbIcon
} from '@/components/Icons';

const NavigationRail = () => {
    const { activeView, setActiveView } = useUIState();

    const navItems = [
        { view: 'chat', icon: ChatBubbleLeftRightIcon, label: 'Chat' },
        { view: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
        { view: 'search', icon: SearchIcon, label: 'Global Search' },
        { view: 'agent_center', icon: RocketLaunchIcon, label: 'Agent Center' },
        { view: 'brain_center', icon: BrainIcon, label: 'Brain Center' },
        { view: 'memory_center', icon: MemoryIcon, label: 'Memory Center' },
        { view: 'contacts_hub', icon: UsersIcon, label: 'Contacts Hub' },
        { view: 'prompts_hub', icon: PromptsIcon, label: 'Prompts Hub' },
        { view: 'tools_hub', icon: ToolsIcon, label: 'Tools Hub' },
        { view: 'projects_hub', icon: ClipboardDocumentListIcon, label: 'Projects Hub' }, // Consolidated Hub
        { view: 'experiences_hub', icon: LightbulbIcon, label: 'Experiences Hub' },
        { view: 'comm_hub', icon: RssIcon, label: 'Comm Hub' },
        { view: 'data_hub', icon: CircleStackIcon, label: 'Data Hub' },
        { view: 'dev_center', icon: CodeIcon, label: 'Dev Center' },
    ] as const;

    return (
        <nav className="flex flex-col items-center gap-2 p-2 bg-gray-900/50 border-r border-gray-700/50 rail-scrollbar overflow-y-auto">
            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    title={item.label}
                    className={`p-3 rounded-lg transition-colors w-full ${
                        activeView === item.view
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                    <item.icon className="w-6 h-6 mx-auto" />
                </button>
            ))}
        </nav>
    );
};

export default NavigationRail;