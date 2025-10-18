
"use client";

import {
    PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon,
    LogIcon, BrainIcon, DashboardIcon, PromptsIcon, RocketLaunchIcon, ToolsIcon, TasksIcon,
    CircleStackIcon, FullscreenIcon, ExitFullscreenIcon, EyeSlashIcon, RefreshIcon, PowerIcon, MagnifyingGlassIcon, ArrowPathIcon 
} from '@/components/Icons';
import React, { type SVGProps, type Dispatch, type SetStateAction } from 'react';

export type IconType = React.FC<SVGProps<SVGSVGElement>>;

export interface Action {
    id: string;
    name: string;
    keywords?: string[];
    group: string;
    icon: IconType;
    action: () => void;
}

interface ActionFunctions {
    createNewConversation: () => void;
    setActiveView: (view: string) => void;
    setBookmarksOpen: Dispatch<SetStateAction<boolean>>;
    setGlobalSettingsOpen: Dispatch<SetStateAction<boolean>>;
    setLogPanelOpen: Dispatch<SetStateAction<boolean>>;
    toggleFullscreen: () => void;
    isFullscreen: boolean;
    toggleZenMode: () => void;
    setDataHubWidgetOpen: Dispatch<SetStateAction<boolean>>;
    softRefreshApp: () => void;
    hardRefreshApp: () => void;
    exitApp: () => void;
    setCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
}

export const getActionsRegistry = (fns: ActionFunctions): Action[] => [
    // Navigation
    { id: 'new-chat', name: 'New Chat', keywords: ['conversation', 'new'], group: 'Navigation', icon: PlusIcon, action: () => fns.createNewConversation() },
    { id: 'go-dashboard', name: 'Go to Dashboard', keywords: ['home', 'main'], group: 'Navigation', icon: DashboardIcon, action: () => fns.setActiveView('dashboard') },
    
    // Hubs
    { id: 'open-memory', name: 'Open Memory Center', keywords: ['knowledge', 'entities', 'structured'], group: 'Hubs', icon: MemoryIcon, action: () => fns.setActiveView('memory_center') },
    { id: 'open-contacts', name: 'Open Contacts Hub', keywords: ['people', 'users'], group: 'Hubs', icon: UsersIcon, action: () => fns.setActiveView('contacts_hub') },
    { id: 'open-prompts', name: 'Open Prompts Hub', keywords: ['templates', 'workflows'], group: 'Hubs', icon: PromptsIcon, action: () => fns.setActiveView('prompts_hub') },
    { id: 'open-tools', name: 'Open Tools Hub', keywords: ['capabilities', 'functions'], group: 'Hubs', icon: ToolsIcon, action: () => fns.setActiveView('tools_hub') },
    { id: 'open-tasks', name: 'Open Tasks Hub', keywords: ['todo', 'list'], group: 'Hubs', icon: TasksIcon, action: () => fns.setActiveView('tasks_hub') },
    { id: 'open-data', name: 'Open Data Hub', keywords: ['database', 'storage', 'services'], group: 'Hubs', icon: CircleStackIcon, action: () => fns.setActiveView('data_hub') },

    // Developer Hubs
    { id: 'open-agent', name: 'Open Agent Center', keywords: ['autonomous', 'runs'], group: 'Developer', icon: RocketLaunchIcon, action: () => fns.setActiveView('agent_center') },
    { id: 'open-brain', name: 'Open Brain Center', keywords: ['cognitive', 'architecture'], group: 'Developer', icon: BrainIcon, action: () => fns.setActiveView('brain_center') },
    { id: 'open-dev', name: 'Open Dev Center', keywords: ['developer', 'api'], group: 'Developer', icon: CodeIcon, action: () => fns.setActiveView('dev_center') },

    // View
    { id: 'toggle-log', name: 'Toggle Log Panel', keywords: ['developer', 'output', 'console'], group: 'View', icon: LogIcon, action: () => fns.setLogPanelOpen(prev => !prev) },
    {
      id: 'toggle-fullscreen',
      name: fns.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
      keywords: ['window', 'full screen', 'maximize'],
      group: 'View',
      icon: fns.isFullscreen ? ExitFullscreenIcon : FullscreenIcon,
      action: fns.toggleFullscreen,
    },
    { id: 'toggle-zen-mode', name: 'Toggle Zen Mode', keywords: ['focus', 'distraction free'], group: 'View', icon: EyeSlashIcon, action: fns.toggleZenMode },

    // Modals & Panels
    { id: 'open-bookmarks', name: 'Open Bookmarks', keywords: ['saved', 'messages'], group: 'Modals & Panels', icon: BookmarkListIcon, action: () => fns.setBookmarksOpen(true) },
    { id: 'open-settings', name: 'Open Global Settings', keywords: ['configuration', 'options'], group: 'Modals & Panels', icon: SettingsIcon, action: () => fns.setGlobalSettingsOpen(true) },
    { id: 'open-data-widget', name: 'Open Data Hub Widget', keywords: ['status', 'services'], group: 'Modals & Panels', icon: CircleStackIcon, action: () => fns.setDataHubWidgetOpen(true) },

    // Application
    { id: 'soft-refresh-app', name: 'Soft Refresh App', keywords: ['reload'], group: 'Application', icon: RefreshIcon, action: fns.softRefreshApp },
    { id: 'hard-refresh-app', name: 'Hard Refresh App', keywords: ['reload', 'cache'], group: 'Application', icon: ArrowPathIcon, action: fns.hardRefreshApp },
    { id: 'exit-app', name: 'Exit App', keywords: ['close', 'quit', 'shutdown'], group: 'Application', icon: PowerIcon, action: fns.exitApp },
];
