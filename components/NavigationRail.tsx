// components/NavigationRail.tsx
"use client";

import React from 'react';
import {
    DashboardIcon, SearchIcon, RocketLaunchIcon, BrainIcon, MemoryIcon,
    UsersIcon, PromptsIcon, ToolsIcon, TasksIcon, CircleStackIcon, CodeIcon,
    ChatBubbleLeftRightIcon, KnowledgeIcon, ClipboardDocumentListIcon
} from '@/components/Icons';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from './providers/ConversationProvider';

const navItems = [
    { view: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { view: 'search', icon: SearchIcon, label: 'Global Search' },
    { view: 'agent_center', icon: RocketLaunchIcon, label: 'Agent Center' },
    { view: 'projects_hub', icon: ClipboardDocumentListIcon, label: 'Projects Hub' },
    { view: 'brain_center', icon: BrainIcon, label: 'Brain Center' },
    { view: 'memory_center', icon: MemoryIcon, label: 'Memory Center' },
    { view: 'contacts_hub', icon: UsersIcon, label: 'Contacts Hub' },
    { view: 'prompts_hub', icon: PromptsIcon, label: 'Prompts Hub' },
    { view: 'tools_hub', icon: ToolsIcon, label: 'Tools Hub' },
    { view: 'tasks_hub', icon: TasksIcon, label: 'Tasks Hub' },
    { view: 'data_hub', icon: CircleStackIcon, label: 'Data Hub' },
    { view: 'experiences_hub', icon: KnowledgeIcon, label: 'Experiences Hub' },
    { view: 'dev_center', icon: CodeIcon, label: 'Dev Center' },
];

const NavigationRail = () => {
    const { activeView, setActiveView } = useUIState();
    const { currentConversation } = useConversation();

    return (
        <nav className="flex flex-col items-center gap-2 p-2 bg-gray-900 border-r border-gray-700/50">
            <button
                onClick={() => setActiveView('chat')}
                disabled={!currentConversation}
                title="Current Chat"
                className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${activeView === 'chat' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed'}`}
            >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </button>
            <div className="w-full h-px bg-gray-700 my-1"></div>
            {navItems.map(({ view, icon: Icon, label }) => (
                <button
                    key={view}
                    onClick={() => setActiveView(view as any)}
                    title={label}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${activeView === view ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    <Icon className="w-6 h-6" />
                </button>
            ))}
        </nav>
    );
};

export default NavigationRail;