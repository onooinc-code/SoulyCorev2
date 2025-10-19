"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { useLog } from './LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

type Theme = 'theme-dark' | 'theme-light' | 'theme-solarized';

interface SettingsContextType {
    settings: AppSettings | null;
    saveSettings: (newSettings: AppSettings) => Promise<void>;
    changeGlobalFontSize: (direction: 'increase' | 'decrease') => void;
    changeMessageFontSize: (direction: 'increase' | 'decrease') => void;
    setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    defaultModelConfig: {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        topP: 0.95,
    },
    defaultAgentConfig: {
        systemPrompt: 'You are a helpful AI assistant.',
        useSemanticMemory: true,
        useStructuredMemory: true,
    },
    enableDebugLog: {
        enabled: false,
    },
    featureFlags: {
        enableMemoryExtraction: true,
        enableProactiveSuggestions: true,
        enableAutoSummarization: true,
    },
    global_ui_settings: {
        fontSize: '16px',
        messageFontSize: 'sm',
        theme: 'theme-dark',
    }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchSettings = useCallback(async () => {
        log('Fetching global settings...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            const data = await res.json();
            const mergedSettings = { ...defaultSettings };

            // Deep merge fetched settings over defaults
            for (const key in defaultSettings) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    if (typeof (mergedSettings as any)[key] === 'object' && (mergedSettings as any)[key] !== null && !Array.isArray((mergedSettings as any)[key])) {
                        (mergedSettings as any)[key] = { ...(defaultSettings as any)[key], ...data[key] };
                    } else {
                        (mergedSettings as any)[key] = data[key];
                    }
                }
            }

            setSettings(mergedSettings);
            log('Global settings loaded successfully.');
        } catch (error) {
            log('Failed to load settings, using defaults.', { error: (error as Error).message }, 'warn');
            setSettings(defaultSettings);
            addNotification({ type: 'error', title: 'Could not load settings', message: 'Using default configuration.' });
        } finally {
            setIsLoading(false);
        }
    }, [log, addNotification]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = useCallback(async (newSettings: AppSettings) => {
        log('Saving global settings...');
        setSettings(newSettings); // Optimistic update
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            if (!res.ok) throw new Error('Failed to save settings to server');
            log('Global settings saved successfully.');
            addNotification({ type: 'success', title: 'Settings Saved' });
        } catch (error) {
            log('Failed to save settings.', { error: (error as Error).message }, 'error');
            addNotification({ type: 'error', title: 'Save Failed', message: 'Could not save settings.' });
            fetchSettings(); // Revert to server state on failure
        }
    }, [log, fetchSettings, addNotification]);
    
    useEffect(() => {
        if (settings?.global_ui_settings?.fontSize) {
            const size = settings.global_ui_settings.fontSize;
            if (typeof size === 'string' && (size.endsWith('px') || size.endsWith('rem') || size.endsWith('em'))) {
                document.documentElement.style.fontSize = size;
            }
        }
        if (settings?.global_ui_settings?.theme) {
            document.documentElement.className = ''; // Clear previous themes
            document.documentElement.classList.add(settings.global_ui_settings.theme);
        }
    }, [settings]);

    const changeGlobalFontSize = useCallback((direction: 'increase' | 'decrease') => {
        if (!settings) return;
        log(`Changing global font size: ${direction}`);

        const currentSizeStr = getComputedStyle(document.documentElement).fontSize || '16px';
        const currentSize = parseFloat(currentSizeStr);
        let newSize;
        if (direction === 'increase') {
            newSize = Math.min(currentSize * 1.1, 24); // Cap at 24px
        } else {
            newSize = Math.max(currentSize * 0.9, 12); // Floor at 12px
        }
        
        const newSettings = JSON.parse(JSON.stringify(settings));
        if (!newSettings.global_ui_settings) newSettings.global_ui_settings = {};
        newSettings.global_ui_settings.fontSize = `${newSize.toFixed(2)}px`;
        saveSettings(newSettings);

    }, [log, settings, saveSettings]);

    const changeMessageFontSize = useCallback((direction: 'increase' | 'decrease') => {
        if (!settings) return;
        log(`Changing message font size: ${direction}`);
        const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
        const currentSize = settings.global_ui_settings?.messageFontSize || 'sm';
        const currentIndex = sizes.indexOf(currentSize);
        let newIndex = currentIndex;
        
        if (direction === 'increase') {
            newIndex = Math.min(currentIndex + 1, sizes.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        
        const newSettings = JSON.parse(JSON.stringify(settings));
        if (!newSettings.global_ui_settings) newSettings.global_ui_settings = {};
        newSettings.global_ui_settings.messageFontSize = sizes[newIndex];
        saveSettings(newSettings);

    }, [log, settings, saveSettings]);

    const setTheme = useCallback((theme: Theme) => {
        if (!settings) return;
        log(`Changing theme to: ${theme}`);
        const newSettings = JSON.parse(JSON.stringify(settings));
        if (!newSettings.global_ui_settings) newSettings.global_ui_settings = {};
        newSettings.global_ui_settings.theme = theme;
        saveSettings(newSettings);
    }, [log, settings, saveSettings]);

    const contextValue = {
        settings,
        saveSettings,
        changeGlobalFontSize,
        changeMessageFontSize,
        setTheme,
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