
"use client";

import React, { useEffect } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import { 
    PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, 
    SettingsIcon, LogIcon, BrainIcon, DashboardIcon, PromptsIcon, 
    ChatBubbleLeftRightIcon,
    RocketLaunchIcon,
    ToolsIcon,
    TasksIcon,
    CircleStackIcon
} from '@/components/Icons';
import { useLog } from './providers/LogProvider';

interface NavItemProps {
    viewName: string;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    tooltip: string;
}

const NavigationRail = ({ setBookmarksOpen, setGlobalSettingsOpen }: {
    setBookmarksOpen: (isOpen: boolean) => void;
    setGlobalSettingsOpen: (isOpen: boolean) => void;
}) => {
    const { 
        activeView, 
        setActiveView, 
        isConversationPanelOpen,
        setConversationPanelOpen,
        setLogPanelOpen,
    } = useUIState();
    const { createNewConversation, currentConversation, setCurrentConversation } = useConversation();
    const { log } = useLog();

    useEffect(() => {
        if (currentConversation) {
            setActiveView('chat');
        } else if (activeView === 'chat') {
            setActiveView('dashboard');
        }
    }, [currentConversation, setActiveView, activeView]);

    const mainViews: NavItemProps[] = [
        { viewName: 'dashboard', label: 'Dashboard', icon: DashboardIcon, tooltip: "Open the main Dashboard Center." },
        { viewName: 'agent_center', label: 'Agent Center', icon: RocketLaunchIcon, tooltip: "Manage and run autonomous agents." },
        { viewName: 'brain_center', label: 'Brain Center', icon: BrainIcon, tooltip: "Manage the AI's core cognitive functions." },
        { viewName: 'memory_center', label: 'Memory Center', icon: MemoryIcon, tooltip: "View and manage the AI's structured knowledge. (Cmd+K)" },
        { viewName: 'contacts_hub', label: 'Contacts Hub', icon: UsersIcon, tooltip: "Manage people and organizations the AI knows about." },
        { viewName: 'prompts_hub', label: 'Prompts Hub', icon: PromptsIcon, tooltip: "Create and manage reusable prompt templates." },
        { viewName: 'tools_hub', label: 'Tools Hub', icon: ToolsIcon, tooltip: "Manage agent tools and capabilities." },
        { viewName: 'tasks_hub', label: 'Tasks Hub', icon: TasksIcon, tooltip: "Manage your tasks and to-do lists." },
        { viewName: 'data_hub', label: 'Data Hub', icon: CircleStackIcon, tooltip: "Manage all data sources and storage." },
        { viewName: 'dev_center', label: 'Dev Center', icon: CodeIcon, tooltip: "Access developer tools and project documentation." },
    ];

    const utilityViews = [
        { label: 'Bookmarks', icon: BookmarkListIcon, action: () => { log('User opened Bookmarks modal.'); setBookmarksOpen(true); }, tooltip: "View all bookmarked messages." },
        { label: 'Global Settings', icon: SettingsIcon, action: () => { log('User opened Global Settings.'); setGlobalSettingsOpen(true); }, tooltip: "Configure application-wide settings." },
        { label: 'Toggle Log Panel', icon: LogIcon, action: () => { log('User toggled the log panel.'); setLogPanelOpen(prev => !prev); }, tooltip: "Show or hide the developer log panel." },
    ];

    const NavButton = ({ item }: { item: NavItemProps }) => (
        <button
            onClick={() => { log(`User navigated to ${item.label}`); setActiveView(item.viewName); setCurrentConversation(null); }}
            title={item.tooltip}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors relative ${
                activeView === item.viewName ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
        >
            <item.icon className="w-6 h-6" />
            {activeView === item.viewName && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></span>
            )}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gray-900/50 p-2 items-center border-r border-gray-700/50">
            <div className="flex-shrink-0 space-y-2">
                <button
                    onClick={createNewConversation}
                    title="New Chat (Cmd+N)"
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setConversationPanelOpen(prev => !prev)}
                    title={isConversationPanelOpen ? "Hide Conversations" : "Show Conversations"}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
                        isConversationPanelOpen ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </button>
            </div>
            
            <hr className="border-gray-700 my-2 w-full" />
            
            <div className="flex-1 overflow-y-auto space-y-2 w-full rail-scrollbar">
                {mainViews.map(item => <div key={item.viewName}><NavButton item={item} /></div>)}
            </div>
            
            <div className="flex-shrink-0 space-y-2 mt-auto pt-2 border-t border-gray-700/50">
                {utilityViews.map(item => (
                    <button
                        key={item.label}
                        onClick={item.action}
                        title={item.tooltip}
                        className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <item.icon className="w-6 h-6" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NavigationRail;
