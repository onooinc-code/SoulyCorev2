
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAppControls } from '@/lib/hooks/useAppControls';
import { useDisplayModeManager } from '@/lib/hooks/useDisplayModeManager';
import { usePanelManager } from '@/lib/hooks/usePanelManager';

type ActiveView = 'chat' | 'dashboard' | 'search' | 'agent_center' | 'brain_center' | 'memory_center' | 'contacts_hub' | 'prompts_hub' | 'tools_hub' | 'projects_hub' | 'data_hub' | 'dev_center' | 'comm_hub' | 'experiences_hub' | 'tasks_hub' | 'memory_extraction_hub' | 'contextual_analyzer' | 'reports_hub';
type MemoryTier = 'semantic' | 'structured' | 'graph' | 'episodic' | null;

interface UIStateContextType {
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    isNavigating: boolean;
    isMobileView: boolean;
    restartApp: () => void;
    exitApp: () => void;
    isZenMode: boolean;
    toggleZenMode: () => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
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
    setDataHubWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
    isToolInspectorOpen: boolean;
    setToolInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isProfileModalOpen: boolean;
    setProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isRoutingModalOpen: boolean;
    setIsRoutingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAgentConfigModalOpen: boolean;
    setAgentConfigModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeMemoryInspector: MemoryTier;
    setMemoryInspector: (tier: MemoryTier) => void;
    isContextMenuEnabled: boolean;
    toggleContextMenu: () => void;
    extractionTarget: { type: string; id: string } | null;
    setExtractionTarget: React.Dispatch<React.SetStateAction<{ type: string; id: string } | null>>;
    toggleMobileView: () => void;
}

const UIStateContext = React.createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeView, rawSetActiveView] = useState<ActiveView>('dashboard');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [isContextMenuEnabled, setIsContextMenuEnabled] = useState(true);
    const [extractionTarget, setExtractionTarget] = useState<{ type: string; id: string } | null>(null);

    const [isBookmarksModalOpen, setBookmarksModalOpen] = useState(false);
    const [isGlobalSettingsModalOpen, setGlobalSettingsModalOpen] = useState(false);
    const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false);
    const [isAddKnowledgeModalOpen, setAddKnowledgeModalOpen] = useState(false);
    const [isHardResetModalOpen, setHardResetModalOpen] = useState(false);
    const [isResponseViewerModalOpen, setResponseViewerModalOpen] = useState(false);
    const [isToolInspectorOpen, setToolInspectorOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);
    const [isAgentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
    const [activeMemoryInspector, setMemoryInspector] = useState<MemoryTier>(null);

    const panelManager = usePanelManager();
    const { setConversationPanelOpen } = panelManager;

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 1024;
            setIsMobileView(isMobile);
            if (isMobile) {
                setConversationPanelOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setConversationPanelOpen]);

    const appControls = useAppControls({ setHardResetModalOpen });
    const displayMode = useDisplayModeManager();
    
    const { isMobileView: _, toggleMobileView: __, ...restDisplayMode } = displayMode;

    const toggleMobileView = useCallback(() => {
        setIsMobileView(prev => !prev);
    }, []);

    const setActiveView = useCallback((view: ActiveView) => {
        if (activeView === view) return;
        setIsNavigating(true);
        rawSetActiveView(view);
        setTimeout(() => setIsNavigating(false), 300);
    }, [activeView]);

    const value: UIStateContextType = {
        activeView,
        setActiveView,
        isNavigating,
        isMobileView,
        toggleMobileView,
        ...appControls,
        ...restDisplayMode,
        ...panelManager,
        isContextMenuEnabled,
        toggleContextMenu: () => setIsContextMenuEnabled(!isContextMenuEnabled),
        isBookmarksModalOpen, setBookmarksModalOpen,
        isGlobalSettingsModalOpen, setGlobalSettingsModalOpen,
        isShortcutsModalOpen, setShortcutsModalOpen,
        isAddKnowledgeModalOpen, setAddKnowledgeModalOpen,
        isHardResetModalOpen, setHardResetModalOpen,
        isResponseViewerModalOpen, setResponseViewerModalOpen,
        isToolInspectorOpen, setToolInspectorOpen,
        isProfileModalOpen, setProfileModalOpen,
        isRoutingModalOpen, setIsRoutingModalOpen,
        isAgentConfigModalOpen, setAgentConfigModalOpen,
        activeMemoryInspector, setMemoryInspector,
        extractionTarget, setExtractionTarget,
    };

    return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
};

export const useUIState = () => {
    const context = React.useContext(UIStateContext);
    if (!context) throw new Error('useUIState must be used within a UIStateProvider');
    return context;
};
