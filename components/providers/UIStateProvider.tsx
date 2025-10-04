
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isConversationPanelOpen, setConversationPanelOpen] = useState(true);
    const [isConversationPanelMinimized, setIsConversationPanelMinimized] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    const [fontSize, setFontSize] = useState('base');
    const [isContextMenuEnabled, setContextMenuEnabled] = useState(true);

    useEffect(() => {
        const savedFontSize = localStorage.getItem('app-font-size');
        if (savedFontSize && fontSizeSteps.includes(savedFontSize)) {
            setFontSize(savedFontSize);
        }
    }, []);

    useEffect(() => {
        fontSizeSteps.forEach(step => {
            document.documentElement.classList.remove(`font-size-${step}`);
        });
        document.documentElement.classList.add(`font-size-${fontSize}`);
        localStorage.setItem('app-font-size', fontSize);
    }, [fontSize]);

    const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
        setFontSize(currentSize => {
            const currentIndex = fontSizeSteps.indexOf(currentSize);
            if (direction === 'increase' && currentIndex < fontSizeSteps.length - 1) {
                return fontSizeSteps[currentIndex + 1];
            }
            if (direction === 'decrease' && currentIndex > 0) {
                return fontSizeSteps[currentIndex - 1];
            }
            return currentSize;
        });
    }, []);

    const toggleContextMenu = useCallback(() => {
        setContextMenuEnabled(prev => !prev);
    }, []);


    const handleSetActiveView = useCallback((view: string) => {
        // If a chat is selected, automatically switch to the chat view
        if (view === 'chat') {
            setActiveView('chat');
        } else {
            // Otherwise, allow switching to any other view
            setActiveView(view);
        }
    }, []);

    const contextValue = {
        activeView,
        setActiveView: handleSetActiveView,
        isConversationPanelOpen,
        setConversationPanelOpen,
        isConversationPanelMinimized,
        setIsConversationPanelMinimized,
        isLogPanelOpen,
        setLogPanelOpen,
        changeFontSize,
        isContextMenuEnabled,
        toggleContextMenu,
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