
"use client";

import React from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { 
    DashboardIcon, 
    ChatBubbleLeftRightIcon,
    SearchIcon,
    Bars3Icon,
    PlusIcon,
    RocketLaunchIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';

const MobileBottomNav = () => {
    const { activeView, setActiveView, setConversationPanelOpen } = useUIState();
    const { createNewConversation } = useConversation();

    const navItems = [
        { view: 'chat', icon: ChatBubbleLeftRightIcon, label: 'الدردشة' },
        { view: 'agent_center', icon: RocketLaunchIcon, label: 'الوكيل' },
        { view: 'dashboard', icon: DashboardIcon, label: 'الرئيسية' },
        { view: 'search', icon: SearchIcon, label: 'بحث' },
    ] as const;

    return (
        <nav className="flex items-center justify-between h-[70px] bg-[#0f1115]/95 backdrop-blur-2xl border-t border-white/5 px-4 pb-2 safe-bottom z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            <button
                onClick={() => setConversationPanelOpen(prev => !prev)}
                className="flex flex-col items-center justify-center w-12 h-full text-gray-500 hover:text-gray-300 transition-colors gap-1"
            >
                <Bars3Icon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-[9px] font-medium opacity-60">القائمة</span>
            </button>

            {navItems.map(item => {
                const isActive = activeView === item.view;
                return (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`group flex flex-col items-center justify-center w-14 h-full gap-1 transition-all relative ${
                            isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-indigo-500/10 scale-110' : ''}`}>
                            <item.icon className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <span className={`text-[9px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                        
                        {isActive && <div className="absolute top-0 w-8 h-0.5 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                    </button>
                );
            })}

            <button
                onClick={createNewConversation}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 text-white active:scale-95 transition-transform mb-2"
                title="محادثة جديدة"
            >
                <PlusIcon className="w-6 h-6" strokeWidth={2} />
            </button>
        </nav>
    );
};

export default MobileBottomNav;
