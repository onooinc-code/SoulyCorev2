"use client";

import React from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { 
    DashboardIcon, 
    ChatBubbleLeftRightIcon,
    SearchIcon,
    Bars3Icon,
    PlusIcon
} from '@/components/Icons';
import { useConversation } from './providers/ConversationProvider';

const MobileBottomNav = () => {
    const { activeView, setActiveView, setConversationPanelOpen } = useUIState();
    const { createNewConversation } = useConversation();

    const navItems = [
        { view: 'dashboard', icon: DashboardIcon, label: 'الرئيسية' },
        { view: 'search', icon: SearchIcon, label: 'البحث' },
        { view: 'chat', icon: ChatBubbleLeftRightIcon, label: 'الدردشة' },
    ] as const;

    return (
        <nav className="flex items-center justify-around h-16 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 px-2 safe-bottom z-40">
            <button
                onClick={() => setConversationPanelOpen(prev => !prev)}
                className="flex flex-col items-center justify-center w-12 h-12 text-gray-400 hover:text-indigo-400 transition-colors"
            >
                <Bars3Icon className="w-6 h-6" />
                <span className="text-[10px] mt-0.5 font-bold">القائمة</span>
            </button>

            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${
                        activeView === item.view ? 'text-indigo-400 scale-110' : 'text-gray-400'
                    }`}
                >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] mt-0.5 font-bold">{item.label}</span>
                </button>
            ))}

            <button
                onClick={createNewConversation}
                className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 text-white active:scale-95 transition-transform"
                title="محادثة جديدة"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
        </nav>
    );
};

export default MobileBottomNav;