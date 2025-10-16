"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSettings } from './SettingsProvider';

const fontSizeSteps = ['sm', 'base', 'lg', 'xl'];

interface UIStateContextType {
    activeView: string;
    setActiveView: (view: string) => void;
    isConversationPanelOpen: boolean;
    setConversationPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConversationPanelMinimized: boolean;
    setIsConversationPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
    isLogPanelOpen: boolean;
    setLogPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    changeFontSize: (direction: 'increase' | 'decrease') => void;
    isContextMenuEnabled: boolean;
    toggleContextMenu: () => void;
    isMobileView: boolean;
    toggleMobileView: () => void;
    isZenMode: boolean;
    toggleZenMode: () => void;
    isDataHubWidgetOpen: boolean;
    setDataHubWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    isNavigating: boolean;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isConversationPanelOpen, setConversationPanelOpen] = useState(true);
    const [isConversationPanelMinimized, setIsConversationPanelMinimized] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    const [fontSize, setFontSize] = useState('base');
    const [isContextMenuEnabled, setContextMenuEnabled] = useState(true);
    const [isMobileView, setIsMobileView] = useState(false);
    const [isZenMode, setZenMode] = useState(false);
    const [isDataHubWidgetOpen, setDataHubWidgetOpen] = useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isNavigating, setNavigating] = useState(false);
    const { settings, saveSettings } = useSettings();

    // Load initial font size from settings first, then fallback to localStorage
    useEffect(() => {
        if (settings?.global_ui_settings?.fontSize && fontSizeSteps.includes(settings.global_ui_settings.fontSize)) {
            setFontSize(settings.global_ui_settings.fontSize);
        } else {
            const savedFontSize = localStorage.getItem('app-font-size');
            if (savedFontSize && fontSizeSteps.includes(savedFontSize)) {
                setFontSize(savedFontSize);
            }
        }
    }, [settings]);

    // Apply class and save to localStorage (for immediate offline persistence)
    useEffect(() => {
        fontSizeSteps.forEach(step => {
            document.documentElement.classList.remove(`font-size-${step}`);
        });
        document.documentElement.classList.add(`font-size-${fontSize}`);
        localStorage.setItem('app-font-size', fontSize);
    }, [fontSize]);

    const handleFullscreenChange = useCallback(() => {
        setIsFullscreen(!!document.fullscreenElement);
    }, []);

    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [handleFullscreenChange]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
        const currentIndex = fontSizeSteps.indexOf(fontSize);
        let newSize = fontSize;

        if (direction === 'increase' && currentIndex < fontSizeSteps.length - 1) {
            newSize = fontSizeSteps[currentIndex + 1];
        } else if (direction === 'decrease' && currentIndex > 0) {
            newSize = fontSizeSteps[currentIndex - 1];
        }

        if (newSize !== fontSize) {
            setFontSize(newSize);
            // Save to database
            if (settings && saveSettings) {
                const newSettings = {
                    ...settings,
                    global_ui_settings: {
                        ...settings.global_ui_settings,
                        fontSize: newSize,
                    },
                };
                // Fire and forget, UI has already updated
                saveSettings(newSettings);
            }
        }
    }, [fontSize, settings, saveSettings]);

    const toggleContextMenu = useCallback(() => {
        setContextMenuEnabled(prev => !prev);
    }, []);

    const toggleMobileView = useCallback(() => {
        setIsMobileView(prev => !prev);
    }, []);

    const handleSetConversationPanelOpen = useCallback((value: React.SetStateAction<boolean>) => {
        const newValue = typeof value === 'function' ? value(isConversationPanelOpen) : value;
        if (newValue) {
            setZenMode(false); // Deactivate Zen Mode if a panel is opened
        }
        setConversationPanelOpen(newValue);
    }, [isConversationPanelOpen]);

    const handleSetLogPanelOpen = useCallback((value: React.SetStateAction<boolean>) => {
        const newValue = typeof value === 'function' ? value(isLogPanelOpen) : value;
        if (newValue) {
            setZenMode(false); // Deactivate Zen Mode if a panel is opened
        }
        setLogPanelOpen(newValue);
    }, [isLogPanelOpen]);

    const toggleZenMode = useCallback(() => {
        setZenMode(prev => {
            const newZenMode = !prev;
            if (newZenMode) {
                // When activating Zen Mode, hide all panels
                setConversationPanelOpen(false);
                setLogPanelOpen(false);
            }
            return newZenMode;
        });
    }, []);

    const handleSetActiveView = useCallback((view: string) => {
        setNavigating(true);
        // If a chat is selected, automatically switch to the chat view
        if (view === 'chat') {
            setActiveView('chat');
        } else {
            // Otherwise, allow switching to any other view
            setActiveView(view);
        }
        setTimeout(() => setNavigating(false), 700); // Match progress bar duration
    }, []);

    const contextValue = {
        activeView,
        setActiveView: handleSetActiveView,
        isConversationPanelOpen,
        setConversationPanelOpen: handleSetConversationPanelOpen,
        isConversationPanelMinimized,
        setIsConversationPanelMinimized,
        isLogPanelOpen,
        setLogPanelOpen: handleSetLogPanelOpen,
        changeFontSize,
        isContextMenuEnabled,
        toggleContextMenu,
        isMobileView,
        toggleMobileView,
        isZenMode,
        toggleZenMode,
        isDataHubWidgetOpen,
        setDataHubWidgetOpen,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isFullscreen,
        toggleFullscreen,
        isNavigating,
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