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
    CodeIcon,
    ChatBubbleLeftRightIcon,
    SearchIcon,
    ClipboardDocumentListIcon,
    RssIcon,
    LightbulbIcon,
    ScissorsIcon,
    DocumentMagnifyingGlassIcon,
    ClipboardPasteIcon
} from '@/components/Icons';

const NavigationRail = () => {
    const { activeView, setActiveView, setConversationPanelOpen } = useUIState();

    const handleChatClick = () => {
        setActiveView('chat');
        setConversationPanelOpen(true);
    };

    const navItems = [
        { view: 'chat', icon: ChatBubbleLeftRightIcon, label: 'Chat', action: handleChatClick },
        { view: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
        { view: 'search', icon: SearchIcon, label: 'Global Search' },
        { view: 'agent_center', icon: RocketLaunchIcon, label: 'Agent Center' },
        { view: 'brain_center', icon: BrainIcon, label: 'Brain Center' },
        { view: 'memory_extraction_hub', icon: ScissorsIcon, label: 'Memory Extraction' },
        { view: 'contextual_analyzer', icon: DocumentMagnifyingGlassIcon, label: 'Contextual Analyzer' },
        { view: 'memory_center', icon: MemoryIcon, label: 'Memory Center' },
        { view: 'contacts_hub', icon: UsersIcon, label: 'Contacts Hub' },
        { view: 'prompts_hub', icon: PromptsIcon, label: 'Prompts Hub' },
        { view: 'tools_hub', icon: ToolsIcon, label: 'Tools Hub' },
        { view: 'projects_hub', icon: ClipboardDocumentListIcon, label: 'Projects Hub' },
        { view: 'experiences_hub', icon: LightbulbIcon, label: 'Experiences Hub' },
        { view: 'comm_hub', icon: RssIcon, label: 'Comm Hub' },
        { view: 'dev_center', icon: CodeIcon, label: 'Dev Center' },
        { view: 'reports_hub', icon: ClipboardPasteIcon, label: 'Reports Hub' },
    ];

    return (
        <nav className="flex flex-col items-center gap-2 p-2 bg-gray-900 border-r border-white/5 rail-scrollbar overflow-y-auto w-16 flex-shrink-0 z-50">
            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={item.action || (() => setActiveView(item.view as any))}
                    title={item.label}
                    className={`p-3 rounded-xl transition-all duration-200 w-full flex justify-center ${
                        activeView === item.view
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                >
                    <item.icon className="w-5 h-5" />
                </button>
            ))}
        </nav>
    );
};

export default NavigationRail;