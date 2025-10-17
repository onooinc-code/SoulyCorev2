
"use client";

import React, { useMemo } from 'react';
import { useUIState } from '../providers/UIStateProvider';
import { useConversation } from '../providers/ConversationProvider';
import { getActionsRegistry } from '@/lib/actionsRegistry';

// Modals
import BookmarksModal from '../BookmarksModal';
import GlobalSettingsModal from '../GlobalSettingsModal';
import ShortcutsModal from '../ShortcutsModal';
import AddKnowledgeModal from '../AddKnowledgeModal';
import CommandPalette from '../CommandPalette';
import DataHubWidget from '../data_hub/DataHubWidget';
import ResponseViewerModal from '../ResponseViewerModal';

interface GlobalModalsProps {
    bookmarksOpen: boolean;
    setBookmarksOpen: React.Dispatch<React.SetStateAction<boolean>>;
    globalSettingsOpen: boolean;
    setGlobalSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    shortcutsOpen: boolean;
    setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    addKnowledgeOpen: boolean;
    setAddKnowledgeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    responseViewerOpen: boolean;
    setResponseViewerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GlobalModals = (props: GlobalModalsProps) => {
    const { 
        isCommandPaletteOpen, setCommandPaletteOpen,
        isDataHubWidgetOpen, setDataHubWidgetOpen,
        setActiveView,
        toggleFullscreen,
        isFullscreen,
        toggleZenMode,
        setLogPanelOpen,
        restartApp,
        exitApp,
    } = useUIState();

    const { createNewConversation } = useConversation();
    
    const commandPaletteActions = useMemo(() => getActionsRegistry({
        createNewConversation,
        setActiveView,
        setBookmarksOpen: props.setBookmarksOpen,
        setGlobalSettingsOpen: props.setGlobalSettingsOpen,
        setLogPanelOpen,
        setCommandPaletteOpen,
        toggleFullscreen,
        isFullscreen,
        toggleZenMode,
        setDataHubWidgetOpen,
        restartApp,
        exitApp,
    }), [
        createNewConversation, setActiveView, props.setBookmarksOpen, props.setGlobalSettingsOpen,
        setLogPanelOpen, setCommandPaletteOpen, toggleFullscreen, isFullscreen, toggleZenMode,
        setDataHubWidgetOpen, restartApp, exitApp
    ]);

    return (
        <>
            {props.bookmarksOpen && <BookmarksModal isOpen={props.bookmarksOpen} setIsOpen={props.setBookmarksOpen} />}
            {props.globalSettingsOpen && <GlobalSettingsModal setIsOpen={props.setGlobalSettingsOpen} />}
            {props.shortcutsOpen && <ShortcutsModal isOpen={props.shortcutsOpen} onClose={() => props.setShortcutsOpen(false)} />}
            {props.addKnowledgeOpen && <AddKnowledgeModal isOpen={props.addKnowledgeOpen} onClose={() => props.setAddKnowledgeOpen(false)} />}
            {props.responseViewerOpen && <ResponseViewerModal isOpen={props.responseViewerOpen} onClose={() => props.setResponseViewerOpen(false)} />}
            
            <CommandPalette 
                isOpen={isCommandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                actions={commandPaletteActions}
            />

            <DataHubWidget 
                isOpen={isDataHubWidgetOpen}
                onClose={() => setDataHubWidgetOpen(false)}
            />
        </>
    );
};

export default GlobalModals;