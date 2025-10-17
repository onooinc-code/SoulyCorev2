
"use client";

// FIX: Added React import to resolve namespace errors for types like React.Dispatch.
import React, { useMemo } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import { getActionsRegistry } from '../actionsRegistry';
import { MenuItem } from '@/components/ContextMenu';
import { ClearIcon } from '@/components/Icons';

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

    const actions = useMemo(() => getActionsRegistry({
        createNewConversation,
        setActiveView,
        setBookmarksOpen: props.setBookmarksOpen,
        setGlobalSettingsOpen: props.setGlobalSettingsOpen,
        setLogPanelOpen,
        toggleFullscreen,
        isFullscreen,
        toggleZenMode,
        setDataHubWidgetOpen,
        restartApp,
        exitApp,
        setCommandPaletteOpen,
    }), [
        createNewConversation, setActiveView, props.setBookmarksOpen, props.setGlobalSettingsOpen,
        setLogPanelOpen, toggleFullscreen, isFullscreen, toggleZenMode, setDataHubWidgetOpen, restartApp, exitApp, setCommandPaletteOpen
    ]);

    const groupedActions = useMemo(() => {
        const actionGroups = actions.reduce((acc, action) => {
            if (!acc[action.group]) acc[action.group] = [];
            acc[action.group].push({
                label: action.name,
                action: action.action,
                icon: action.icon,
                disabled: false, // Default state
            });
            return acc;
        }, {} as Record<string, MenuItem[]>);

        // Add dynamic/conditional actions here
        actionGroups['Conversation'] = [
            {
                label: 'Clear Chat History',
                icon: ClearIcon,
                action: () => { if(currentConversation) clearMessages(currentConversation.id); },
                disabled: !currentConversation,
            }
        ];

        return actionGroups;

    }, [actions, currentConversation, clearMessages]);

    // Build the final menu structure with separators
    return useMemo(() => {
        const menuItems: MenuItem[] = [];
        const groupOrder = ['Navigation', 'Hubs', 'Developer', 'View', 'Modals & Panels', 'Conversation', 'Application'];
        
        groupOrder.forEach(group => {
            if (groupedActions[group]) {
                if (menuItems.length > 0) menuItems.push({ isSeparator: true });
                menuItems.push(...groupedActions[group]);
            }
        });

        return menuItems;
    }, [groupedActions]);
};