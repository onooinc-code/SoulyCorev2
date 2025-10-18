
"use client";

// FIX: Added React import to resolve namespace errors for types like React.Dispatch.
import React, { useMemo } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { MenuItem } from '@/components/ContextMenu';
import { 
    ClearIcon, PlusIcon, MinusIcon, MemoryIcon, UsersIcon, CodeIcon, 
    BookmarkListIcon, SettingsIcon, LogIcon, BrainIcon, DashboardIcon, PromptsIcon, 
    RocketLaunchIcon, ToolsIcon, TasksIcon, CircleStackIcon, FullscreenIcon, 
    ExitFullscreenIcon, EyeSlashIcon, RefreshIcon, PowerIcon, MagnifyingGlassIcon 
} from '@/components/Icons';


interface UseAppContextMenuProps {
    setBookmarksOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setGlobalSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAddKnowledgeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setResponseViewerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useAppContextMenu = (props: UseAppContextMenuProps): MenuItem[] => {
    const { createNewConversation, currentConversation, clearMessages } = useConversation();
    const { changeMessageFontSize } = useSettings();
    const { 
        setActiveView, 
        toggleFullscreen, 
        isFullscreen, 
        toggleZenMode,
        setLogPanelOpen,
        setDataHubWidgetOpen,
        restartApp,
        exitApp,
        setCommandPaletteOpen,
    } = useUIState();

    // Build the final menu structure with separators and sub-menus
    return useMemo(() => {
        const menuItems: MenuItem[] = [
            { label: 'New Chat', icon: PlusIcon, action: createNewConversation },
            { label: 'Open Command Palette', icon: MagnifyingGlassIcon, action: () => props.setCommandPaletteOpen(true) },
            { isSeparator: true },
            { 
                label: 'Go to...', 
                icon: DashboardIcon, 
                children: [
                    { label: 'Dashboard', icon: DashboardIcon, action: () => { setActiveView('dashboard'); if(currentConversation) { /* Logic to deselect might be needed */ } } },
                    { label: 'Agent Center', icon: RocketLaunchIcon, action: () => setActiveView('agent_center') },
                    { label: 'Brain Center', icon: BrainIcon, action: () => setActiveView('brain_center') },
                ]
            },
            {
                label: 'Hubs',
                icon: CircleStackIcon,
                children: [
                    { label: 'Memory Center', icon: MemoryIcon, action: () => setActiveView('memory_center') },
                    { label: 'Contacts Hub', icon: UsersIcon, action: () => setActiveView('contacts_hub') },
                    { label: 'Prompts Hub', icon: PromptsIcon, action: () => setActiveView('prompts_hub') },
                    { label: 'Tools Hub', icon: ToolsIcon, action: () => setActiveView('tools_hub') },
                    { label: 'Tasks Hub', icon: TasksIcon, action: () => setActiveView('tasks_hub') },
                    { label: 'Data Hub', icon: CircleStackIcon, action: () => setActiveView('data_hub') },
                    { label: 'Dev Center', icon: CodeIcon, action: () => setActiveView('dev_center') },
                ]
            },
            { isSeparator: true },
            {
                label: 'View Options',
                icon: isFullscreen ? ExitFullscreenIcon : FullscreenIcon,
                children: [
                    { label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen', icon: isFullscreen ? ExitFullscreenIcon : FullscreenIcon, action: toggleFullscreen },
                    { label: 'Toggle Zen Mode', icon: EyeSlashIcon, action: toggleZenMode },
                    { 
                        label: 'Message Font Size', 
                        icon: PlusIcon, 
                        children: [
                            { label: 'Increase Font Size', icon: PlusIcon, action: () => changeMessageFontSize('increase') },
                            { label: 'Decrease Font Size', icon: MinusIcon, action: () => changeMessageFontSize('decrease') },
                        ]
                    },
                ]
            },
            {
                label: 'Tools',
                icon: ToolsIcon,
                children: [
                    { label: 'Open Bookmarks', icon: BookmarkListIcon, action: () => props.setBookmarksOpen(true) },
                    { label: 'Global Settings', icon: SettingsIcon, action: () => props.setGlobalSettingsOpen(true) },
                    { label: 'Toggle Log Panel', icon: LogIcon, action: () => setLogPanelOpen(p => !p) },
                ]
            },
            { isSeparator: true },
            {
                label: 'Conversation Actions',
                icon: ClearIcon,
                disabled: !currentConversation,
                children: [
                     { label: 'Clear Chat History', icon: ClearIcon, action: () => { if(currentConversation) clearMessages(currentConversation.id); }, disabled: !currentConversation },
                ]
            },
            { isSeparator: true },
            { label: 'Restart App', icon: RefreshIcon, action: restartApp },
            { label: 'Exit App', icon: PowerIcon, action: exitApp },
        ];

        return menuItems;
    // FIX: Added setCommandPaletteOpen to the dependency array to match its usage.
    }, [
        createNewConversation, currentConversation, clearMessages, changeMessageFontSize,
        setActiveView, toggleFullscreen, isFullscreen, toggleZenMode, setLogPanelOpen,
        restartApp, exitApp, props, setCommandPaletteOpen
    ]);
};