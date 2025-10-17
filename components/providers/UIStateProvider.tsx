"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { usePanelManager } from '@/lib/hooks/usePanelManager';
import { useDisplayModeManager } from '@/lib/hooks/useDisplayModeManager';
import { useAppControls } from '@/lib/hooks/useAppControls';
import { useLog } from './LogProvider';

interface UIStateContextType {
    activeView: string;
    setActiveView: (view: string) => void;
    isNavigating: boolean;

    isContextMenuEnabled: boolean;
    toggleContextMenu: () => void;
    
    // from usePanelManager
    isConversationPanelOpen: boolean;
    setConversationPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConversationPanelMinimized: boolean;
    setIsConversationPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
    isLogPanelOpen: boolean;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isDataHubWidgetOpen: boolean;
    setDataHubWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    // from useDisplayModeManager
    isMobileView: boolean;
    toggleMobileView: () => void;
    isZenMode: boolean;
    toggleZenMode: () => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;

    // from useAppControls
    restartApp: () => void;
    exitApp: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { log } = useLog();

    const [activeView, _setActiveView] = useState('dashboard');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isContextMenuEnabled, setIsContextMenuEnabled] = useState(true);

    const panelState = usePanelManager();
    const displayModeState = useDisplayModeManager();
    const appControlsState = useAppControls();

    const setActiveView = useCallback((view: string) => {
        log(`Navigating to view: ${view}`);
        setIsNavigating(true);
        _setActiveView(view);
        // Simulate navigation time for progress bar
        setTimeout(() => setIsNavigating(false), 500);
    }, [log]);
    
    const toggleContextMenu = useCallback(() => {
        log('Toggling context menu enabled state.');
        setIsContextMenuEnabled(prev => !prev);
    }, [log]);

    const contextValue = {
        activeView,
        setActiveView,
        isNavigating,
        isContextMenuEnabled,
        toggleContextMenu,
        ...panelState,
        ...displayModeState,
        ...appControlsState,
    };
    
    return (
        <UIStateContext.Provider value={contextValue}>
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