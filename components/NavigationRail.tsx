
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
    CircleStackIcon,
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
        { view: 'data_hub', icon: CircleStackIcon, label: 'البيانات' },
        { view: 'reports_hub', icon: ClipboardPasteIcon, label: 'التقارير' },
        { view: 'dev_center', icon: CodeIcon, label: 'المطورين' },
    ];

    return (
        <nav className="flex flex-col items-center gap-2 p-3 bg-[#0a0a0f] border-r border-white/5 overflow-y-auto w-[72px] flex-shrink-0 z-50 custom-scrollbar no-scrollbar">
            <div className="mb-4 mt-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                    <BrainIcon className="w-6 h-6 text-white" />
                </div>
            </div>

            {navItems.map(item => {
                const isActive = activeView === item.view;
                return (
                    <button
                        key={item.view}
                        onClick={item.action || (() => setActiveView(item.view as any))}
                        className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ease-out ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <item.icon className={`w-[22px] h-[22px] transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`} strokeWidth={1.5} />
                        
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 border border-white/10 shadow-xl whitespace-nowrap z-[100]">
                            {item.label}
                            <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-[4px] border-4 border-transparent border-r-gray-900"></div>
                        </div>

                        {/* Active Indicator Dot */}
                        {isActive && (
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-full blur-[1px]" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default NavigationRail;
