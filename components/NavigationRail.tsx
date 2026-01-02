
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
        { view: 'chat', icon: ChatBubbleLeftRightIcon, label: 'الدردشة', action: handleChatClick },
        { view: 'dashboard', icon: DashboardIcon, label: 'لوحة التحكم' },
        { view: 'search', icon: SearchIcon, label: 'البحث الشامل' },
        { view: 'agent_center', icon: RocketLaunchIcon, label: 'مركز الوكلاء' },
        { view: 'brain_center', icon: BrainIcon, label: 'إدارة العقل' },
        { view: 'memory_center', icon: MemoryIcon, label: 'مركز الذاكرة' },
        { view: 'contacts_hub', icon: UsersIcon, label: 'جهات الاتصال' },
        { view: 'prompts_hub', icon: PromptsIcon, label: 'الموجهات' },
        { view: 'tools_hub', icon: ToolsIcon, label: 'الأدوات' },
        { view: 'projects_hub', icon: ClipboardDocumentListIcon, label: 'المشاريع' },
        { view: 'dev_center', icon: CodeIcon, label: 'المطورين' },
    ];

    return (
        <nav className="flex flex-col items-center gap-3 p-3 bg-gray-950 border-r border-white/5 overflow-y-auto w-20 flex-shrink-0 z-50 custom-scrollbar">
            <div className="mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <BrainIcon className="w-6 h-6 text-white" />
                </div>
            </div>

            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={item.action || (() => setActiveView(item.view as any))}
                    className={`group desktop-nav-rail-item ${
                        activeView === item.view
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40'
                            : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                    <item.icon className="w-6 h-6" />
                    
                    {/* Tooltip */}
                    <span className="tooltip absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 pointer-events-none transition-all translate-x-2 whitespace-nowrap border border-white/10 shadow-2xl z-[100]">
                        {item.label}
                    </span>

                    {/* Active Indicator */}
                    {activeView === item.view && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-l-full" />
                    )}
                </button>
            ))}
        </nav>
    );
};

export default NavigationRail;
