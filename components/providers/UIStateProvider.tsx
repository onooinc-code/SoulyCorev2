// components/providers/UIStateProvider.tsx
"use client";

import React from 'react';
import { useAppControls } from '@/lib/hooks/useAppControls';
import { useDisplayModeManager } from '@/lib/hooks/useDisplayModeManager';
import { usePanelManager } from '@/lib/hooks/usePanelManager';

type ActiveView = 'chat' | 'dashboard' | 'search' | 'agent_center' | 'brain_center' | 'memory_center' | 'contacts_hub' | 'prompts_hub' | 'tools_hub' | 'tasks_hub' | 'data_hub' | 'dev_center' | 'comm_hub' | 'experiences_hub';

interface UIStateContextType {
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    isNavigating: boolean;

    // From useAppControls
    restartApp: () => void;
    exitApp: () => void;
    
    // From useDisplayModeManager
    isMobileView: boolean;
    toggleMobileView: () => void;
    isZenMode: boolean;
    toggleZenMode: () => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;

    // From usePanelManager
    isConversationPanelOpen: boolean;
    setConversationPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConversationPanelMinimized: boolean;
    setIsConversationPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
    isConversationPanelPinned: boolean;
    setIsConversationPanelPinned: React.Dispatch<React.SetStateAction<boolean>>;
    isLogPanelOpen: boolean;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isDataHubWidgetOpen: boolean;
    setDataHubWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Global Modals State
    isBookmarksModalOpen: boolean;
    setBookmarksModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isGlobalSettingsModalOpen: boolean;
    setGlobalSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isShortcutsModalOpen: boolean;
    setShortcutsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAddKnowledgeModalOpen: boolean;
    setAddKnowledgeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isHardResetModalOpen: boolean;
    setHardResetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isResponseViewerModalOpen: boolean;
    setResponseViewerModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

    isContextMenuEnabled: boolean;
    toggleContextMenu: () => void;
}

const UIStateContext = React.createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeView, rawSetActiveView] = React.useState<ActiveView>('dashboard');
    const [isNavigating, setIsNavigating] = React.useState(false);
    const [isContextMenuEnabled, setIsContextMenuEnabled] = React.useState(true);

    // Global Modals State
    const [isBookmarksModalOpen, setBookmarksModalOpen] = React.useState(false);
    const [isGlobalSettingsModalOpen, setGlobalSettingsModalOpen] = React.useState(false);
    const [isShortcutsModalOpen, setShortcutsModalOpen] = React.useState(false);
    const [isAddKnowledgeModalOpen, setAddKnowledgeModalOpen] = React.useState(false);
    const [isHardResetModalOpen, setHardResetModalOpen] = React.useState(false);
    const [isResponseViewerModalOpen, setResponseViewerModalOpen] = React.useState(false);


    const appControls = useAppControls({ setHardResetModalOpen });
    const displayMode = useDisplayModeManager();
    const panelManager = usePanelManager();
    
    const setActiveView = React.useCallback((view: ActiveView) => {
        if (activeView === view) return;
        setIsNavigating(true);
        rawSetActiveView(view);
        setTimeout(() => setIsNavigating(false), 500); 
    }, [activeView]);

    const toggleContextMenu = React.useCallback(() => {
        setIsContextMenuEnabled(prev => !prev);
    }, []);

    const value: UIStateContextType = {
        activeView,
        setActiveView,
        isNavigating,
        ...appControls,
        ...displayMode,
        ...panelManager,
        isContextMenuEnabled,
        toggleContextMenu,
        isBookmarksModalOpen,
        setBookmarksModalOpen,
        isGlobalSettingsModalOpen,
        setGlobalSettingsModalOpen,
        isShortcutsModalOpen,
        setShortcutsModalOpen,
        isAddKnowledgeModalOpen,
        setAddKnowledgeModalOpen,
        isHardResetModalOpen,
        setHardResetModalOpen,
        isResponseViewerModalOpen,
        setResponseViewerModalOpen,
    };

    return (
        <UIStateContext.Provider value={value}>
            {children}
        </UIStateContext.Provider>
    );
};

export const useUIState = () => {
    const context = React.useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};