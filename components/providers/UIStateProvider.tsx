"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useAppControls } from '@/lib/hooks/useAppControls';
import { useDisplayModeManager } from '@/lib/hooks/useDisplayModeManager';
import { usePanelManager } from '@/lib/hooks/usePanelManager';

type ActiveView = 'chat' | 'dashboard' | 'search' | 'agent_center' | 'brain_center' | 'memory_center' | 'contacts_hub' | 'prompts_hub' | 'tools_hub' | 'tasks_hub' | 'data_hub' | 'dev_center';

interface UIStateContextType {
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    isNavigating: boolean; // For top progress bar

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
    
    isContextMenuEnabled: boolean;
    toggleContextMenu: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeView, rawSetActiveView] = useState<ActiveView>('dashboard');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isContextMenuEnabled, setIsContextMenuEnabled] = useState(true);

    const appControls = useAppControls();
    const displayMode = useDisplayModeManager();
    const panelManager = usePanelManager();
    
    const setActiveView = useCallback((view: ActiveView) => {
        if (activeView === view) return;
        setIsNavigating(true);
        rawSetActiveView(view);
        // Simulate navigation time for progress bar
        setTimeout(() => setIsNavigating(false), 500); 
    }, [activeView]);

    const toggleContextMenu = useCallback(() => {
        setIsContextMenuEnabled(prev => !prev);
    }, []);

    const value = {
        activeView,
        setActiveView,
        isNavigating,
        ...appControls,
        ...displayMode,
        ...panelManager,
        isContextMenuEnabled,
        toggleContextMenu,
    };

    return (
        <UIStateContext.Provider value={value}>
            {children}
        </UIStateContext.Provider>
    );
};

export const useUIState = () => {
    const context = useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};
