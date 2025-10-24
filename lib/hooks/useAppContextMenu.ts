
// lib/hooks/useAppContextMenu.ts
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import { 
    PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon, 
    SettingsIcon, LogIcon, BrainIcon, DashboardIcon, PromptsIcon, 
    ChatBubbleLeftRightIcon,
    RocketLaunchIcon,
    ToolsIcon,
    ClipboardDocumentListIcon,
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
        setActiveView,
        isContextMenuEnabled,
        setConversationPanelOpen,
        setCommandPaletteOpen,
        restartApp,
        exitApp,
        setBookmarksModalOpen,
        setGlobalSettingsModalOpen,
        setShortcutsModalOpen,
        setAddKnowledgeModalOpen,
        setResponseViewerModalOpen,
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

    const menuItems = useMemo(() => [
        { label: 'Application', children: [
            { label: 'New Chat', icon: PlusIcon, action: createNewConversation },
            { label: 'Open Command Palette', icon: SearchIcon, action: () => setCommandPaletteOpen(true) },
            { label: 'Global Settings', icon: SettingsIcon, action: () => setGlobalSettingsModalOpen(true) },
            { label: 'Keyboard Shortcuts', icon: KeyboardIcon, action: () => setShortcutsModalOpen(true) },
            { label: 'View Last AI Report', icon: CodeIcon, action: () => setResponseViewerModalOpen(true) },
            { isSeparator: true },
            { label: 'Hard Reset App', icon: RefreshIcon, action: restartApp },
            { label: 'Exit Application', icon: PowerIcon, action: exitApp },
        ]},
        { isSeparator: true },
        { label: 'Conversation', disabled: !currentConversation, children: [
            { label: 'Show Conversation List', icon: ChatBubbleLeftRightIcon, action: () => setConversationPanelOpen(true) },
            { isSeparator: true },
            { label: 'Clear All Messages', icon: TrashIcon, action: () => { if(currentConversation) clearMessages(currentConversation.id); } },
            { label: 'Delete Conversation', icon: TrashIcon, action: () => { if(currentConversation) deleteConversation(currentConversation.id); } },
        ]},
        { isSeparator: true },
        { label: 'Memory', children: [
            { label: 'Add Knowledge Snippet', icon: KnowledgeIcon, action: () => setAddKnowledgeModalOpen(true) },
            { label: 'View Bookmarks', icon: BookmarkListIcon, action: () => setBookmarksModalOpen(true) },
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
            { label: 'Tasks Hub', icon: ClipboardDocumentListIcon, action: () => setActiveView('tasks_hub') },
            { label: 'Data Hub', icon: CircleStackIcon, action: () => setActiveView('data_hub') },
            { label: 'Dev Center', icon: CodeIcon, action: () => setActiveView('dev_center') },
        ]},
    ] as MenuItem[], [
        createNewConversation, currentConversation, deleteConversation, clearMessages, 
        restartApp, exitApp, setActiveView, setConversationPanelOpen, setCommandPaletteOpen,
        setBookmarksModalOpen, setGlobalSettingsModalOpen, setShortcutsModalOpen,
        setAddKnowledgeModalOpen, setResponseViewerModalOpen
    ]);

    return {
        menuItems: menuItems as MenuItem[],
        contextMenu,
        handleContextMenu,
        closeContextMenu,
    };
};