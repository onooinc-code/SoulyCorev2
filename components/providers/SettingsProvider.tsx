"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { useLog } from './LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

interface SettingsContextType {
    settings: AppSettings | null;
    saveSettings: (newSettings: AppSettings) => Promise<void>;
    setTheme: (theme: 'theme-dark' | 'theme-light' | 'theme-solarized') => void;
    changeGlobalFontSize: (direction: 'increase' | 'decrease') => void;
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
    enableDebugLog: { enabled: true },
    featureFlags: {
        enableMemoryExtraction: true,
        enableProactiveSuggestions: true,
        enableAutoSummarization: true,
    },
    global_ui_settings: {
        fontSize: '16px',
        messageFontSize: 'base',
        theme: 'theme-dark',
    }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const applyTheme = (theme: string) => {
        document.documentElement.className = '';
        document.documentElement.classList.add(theme);
    };

    const applyFontSize = (fontSize: string) => {
        document.documentElement.style.fontSize = fontSize;
    };

    const loadSettings = useCallback(async () => {
        log('Loading global settings...');
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                if (data.global_ui_settings?.theme) {
                    applyTheme(data.global_ui_settings.theme);
                }
                if (data.global_ui_settings?.fontSize) {
                    applyFontSize(data.global_ui_settings.fontSize);
                }
            } else {
                throw new Error('Failed to fetch settings, using defaults.');
            }
        } catch (error) {
            log('Error loading settings', { error: (error as Error).message }, 'error');
            setSettings(defaultSettings);
            applyTheme(defaultSettings.global_ui_settings!.theme!);
            applyFontSize(defaultSettings.global_ui_settings!.fontSize!);
        }
    }, [log]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const saveSettings = useCallback(async (newSettings: AppSettings) => {
        log('Saving global settings...');
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            if (!res.ok) throw new Error('Failed to save settings.');
            
            const savedSettings = await res.json();
            setSettings(savedSettings);
            if (savedSettings.global_ui_settings?.theme) {
                applyTheme(savedSettings.global_ui_settings.theme);
            }
            if (savedSettings.global_ui_settings?.fontSize) {
                applyFontSize(savedSettings.global_ui_settings.fontSize);
            }
            addNotification({ type: 'success', title: 'Settings Saved' });
        } catch (error) {
            log('Error saving settings', { error: (error as Error).message }, 'error');
            addNotification({ type: 'error', title: 'Save Failed', message: (error as Error).message });
            throw error;
        }
    }, [log, addNotification]);

    const setTheme = useCallback((theme: 'theme-dark' | 'theme-light' | 'theme-solarized') => {
        if (settings) {
            const newSettings = {
                ...settings,
                global_ui_settings: {
                    ...(settings.global_ui_settings || {}),
                    theme,
                },
            };
            setSettings(newSettings);
            applyTheme(theme);
            // Debounce save? No, save immediately on theme change.
            saveSettings(newSettings);
        }
    }, [settings, saveSettings]);

    const changeGlobalFontSize = useCallback((direction: 'increase' | 'decrease') => {
        if (settings && settings.global_ui_settings?.fontSize) {
            const currentSize = parseFloat(settings.global_ui_settings.fontSize);
            let newSize;
            if (direction === 'increase') {
                newSize = Math.min(currentSize * 1.1, 24);
            } else {
                newSize = Math.max(currentSize * 0.9, 12);
            }
            const newFontSize = `${newSize}px`;
            
            const newSettings = {
                ...settings,
                global_ui_settings: {
                    ...(settings.global_ui_settings || {}),
                    fontSize: newFontSize,
                },
            };
            setSettings(newSettings);
            applyFontSize(newFontSize);
            saveSettings(newSettings);
        }
    }, [settings, saveSettings]);

    return (
        <SettingsContext.Provider value={{ settings, saveSettings, setTheme, changeGlobalFontSize }}>
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
