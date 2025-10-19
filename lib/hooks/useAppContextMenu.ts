"use client";

import { useState, useCallback, useMemo } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import { 
    PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, 
    SettingsIcon, LogIcon, BrainIcon, DashboardIcon, PromptsIcon, 
    ChatBubbleLeftRightIcon,
    RocketLaunchIcon,
    ToolsIcon,
    TasksIcon,
    CircleStackIcon,
    RefreshIcon,
    PowerIcon,
    KeyboardIcon,
    TrashIcon,
    KnowledgeIcon,
    SearchIcon
} from '@/components/Icons';
import type { MenuItem } from '@/components/ContextMenu';

export const useAppContextMenu = () => {
    const { 
        activeView, 
        setActiveView,
        isContextMenuEnabled,
        setConversationPanelOpen,
        setCommandPaletteOpen,
        restartApp,
        exitApp
    } = useUIState();
    const {
        currentConversation,
        createNewConversation,
        deleteConversation,
        clearMessages
    } = useConversation();
    
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
    }>({ isOpen: false, position: { x: 0, y: 0 } });

    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        if (!isContextMenuEnabled) return;
        event.preventDefault();
        setContextMenu({ isOpen: true, position: { x: event.clientX, y: event.clientY } });
    }, [isContextMenuEnabled]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    const menuItems: MenuItem[] = useMemo(() => [
        { label: 'Application', children: [
            { label: 'New Chat', icon: PlusIcon, action: createNewConversation },
            { label: 'Open Command Palette', icon: SearchIcon, action: () => setCommandPaletteOpen(true) },
            { label: 'Global Settings', icon: SettingsIcon, action: () => {} /* Handled in GlobalModals */ },
            { label: 'Keyboard Shortcuts', icon: KeyboardIcon, action: () => {} /* Handled in GlobalModals */ },
            { isSeparator: true },
            { label: 'Hard Refresh App', icon: RefreshIcon, action: restartApp },
            { label: 'Exit Application', icon: PowerIcon, action: exitApp },
        ]},
        { isSeparator: true },
        { label: 'Conversation', disabled: !currentConversation, children: [
            { label: 'Show Conversation List', icon: ChatBubbleLeftRightIcon, action: () => setConversationPanelOpen(true) },
            { isSeparator: true },
            { label: 'Clear All Messages', icon: TrashIcon, action: () => { if(currentConversation) clearMessages(currentConversation.id) } },
            { label: 'Delete Conversation', icon: TrashIcon, action: () => { if(currentConversation) deleteConversation(currentConversation.id) } },
        ]},
        { isSeparator: true },
        { label: 'Memory', children: [
            { label: 'Add Knowledge Snippet', icon: KnowledgeIcon, action: () => {} /* Handled in GlobalModals */ },
            { label: 'View Bookmarks', icon: BookmarkListIcon, action: () => {} /* Handled in GlobalModals */ },
        ]},
        { isSeparator: true },
        { label: 'Quick Access', children: [
            { label: 'Dashboard', icon: DashboardIcon, action: () => setActiveView('dashboard') },
            { label: 'Agent Center', icon: RocketLaunchIcon, action: () => setActiveView('agent_center') },
            { label: 'Brain Center', icon: BrainIcon, action: () => setActiveView('brain_center') },
            { label: 'Memory Center', icon: MemoryIcon, action: () => setActiveView('memory_center') },
            { label: 'Contacts Hub', icon: UsersIcon, action: () => setActiveView('contacts_hub') },
            { label: 'Prompts Hub', icon: PromptsIcon, action: () => setActiveView('prompts_hub') },
            { label: 'Tools Hub', icon: ToolsIcon, action: () => setActiveView('tools_hub') },
            { label: 'Tasks Hub', icon: TasksIcon, action: () => setActiveView('tasks_hub') },
            { label: 'Data Hub', icon: CircleStackIcon, action: () => setActiveView('data_hub') },
            { label: 'Dev Center', icon: CodeIcon, action: () => setActiveView('dev_center') },
        ]},
    ], [createNewConversation, currentConversation, deleteConversation, clearMessages, restartApp, exitApp, setActiveView, setConversationPanelOpen, setCommandPaletteOpen]);

    return {
        menuItems,
        contextMenu,
        handleContextMenu,
        closeContextMenu,
    };
};
