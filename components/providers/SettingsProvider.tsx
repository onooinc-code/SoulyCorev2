"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { useLog } from './LogProvider';

type MessageFontSize = 'sm' | 'base' | 'lg' | 'xl';
const fontSizes: MessageFontSize[] = ['sm', 'base', 'lg', 'xl'];

interface SettingsContextType {
    settings: AppSettings | null;
    loadSettings: () => Promise<void>;
    saveSettings: (newSettings: AppSettings) => Promise<void>;
    changeMessageFontSize: (direction: 'increase' | 'decrease') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const { log, setLoggingEnabled } = useLog();

    useEffect(() => {
        if (settings) {
            setLoggingEnabled(settings.enableDebugLog.enabled);
            
            // Apply message font size class to HTML element
            const messageSize = settings.global_ui_settings?.messageFontSize || 'base';
            document.documentElement.classList.remove(...fontSizes.map(s => `message-font-${s}`));
            document.documentElement.classList.add(`message-font-${messageSize}`);
        }
    }, [settings, setLoggingEnabled]);
    
    const loadSettings = useCallback(async () => {
        log('Attempting to load global settings...');
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error("Failed to fetch settings.");
            const appSettings: AppSettings = await res.json();
            setSettings(appSettings);
            log('Global settings loaded successfully.', appSettings);
        } catch (error) {
             log('Failed to load global settings.', { error: (error as Error).message }, 'error');
        }
    }, [log]);

    const saveSettings = useCallback(async (newSettings: AppSettings) => {
        log('Saving global settings...', newSettings);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            if (!res.ok) throw new Error('Failed to save settings');
            const updatedSettings: AppSettings = await res.json();
            setSettings(updatedSettings);
            log('Global settings saved successfully.');
        } catch (error) {
            log('Failed to save global settings.', { error: (error as Error).message }, 'error');
            throw error; // Re-throw to be handled by the UI
        }
    }, [log]);

    const changeMessageFontSize = useCallback((direction: 'increase' | 'decrease') => {
        if (!settings) return;

        const currentSize = settings.global_ui_settings?.messageFontSize || 'base';
        const currentIndex = fontSizes.indexOf(currentSize);
        let newIndex = currentIndex;

        if (direction === 'increase') {
            newIndex = Math.min(currentIndex + 1, fontSizes.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }

        const newSize = fontSizes[newIndex];
        const newSettings: AppSettings = {
            ...settings,
            global_ui_settings: {
                ...settings.global_ui_settings,
                messageFontSize: newSize,
            }
        };
        // This will trigger the useEffect to apply the class and also save to DB
        saveSettings(newSettings); 
    }, [settings, saveSettings]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const contextValue = {
        settings,
        loadSettings,
        saveSettings,
        changeMessageFontSize,
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
