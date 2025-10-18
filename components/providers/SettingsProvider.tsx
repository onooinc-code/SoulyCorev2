
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppSettings } from '@/lib/types';
import { useLog } from './LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

interface SettingsContextType {
    settings: AppSettings | null;
    saveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
    changeMessageFontSize: (direction: 'increase' | 'decrease') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    defaultModelConfig: { model: 'gemini-2.5-flash', temperature: 0.7, topP: 0.95 },
    defaultAgentConfig: { systemPrompt: "You are a helpful AI assistant.", useSemanticMemory: true, useStructuredMemory: true },
    enableDebugLog: { enabled: false },
    featureFlags: { enableMemoryExtraction: true, enableProactiveSuggestions: true, enableAutoSummarization: true },
    global_ui_settings: { fontSize: "base", messageFontSize: "sm" }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const loadSettings = useCallback(async () => {
        try {
            log('Loading global settings...');
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error("Failed to fetch settings.");
            const data = await res.json();
            // Merge fetched settings with defaults to ensure all keys are present
            const mergedSettings = {
                defaultModelConfig: { ...defaultSettings.defaultModelConfig, ...data.defaultModelConfig },
                defaultAgentConfig: { ...defaultSettings.defaultAgentConfig, ...data.defaultAgentConfig },
                enableDebugLog: { ...defaultSettings.enableDebugLog, ...data.enableDebugLog },
                featureFlags: { ...defaultSettings.featureFlags, ...data.featureFlags },
                global_ui_settings: { ...defaultSettings.global_ui_settings, ...data.global_ui_settings },
            };
            setSettings(mergedSettings);
            log('Global settings loaded.');
        } catch (error) {
            log('Failed to load settings, using defaults.', { error: (error as Error).message }, 'warn');
            setSettings(defaultSettings);
        }
    }, [log]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const saveSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        if (!settings) return;
        
        log('Saving global settings...');
        
        // Deep merge the new settings into the old ones
        const updatedSettings: AppSettings = {
            ...settings,
            ...newSettings,
            defaultModelConfig: { ...settings.defaultModelConfig, ...newSettings.defaultModelConfig },
            defaultAgentConfig: { ...settings.defaultAgentConfig, ...newSettings.defaultAgentConfig },
            enableDebugLog: { ...settings.enableDebugLog, ...newSettings.enableDebugLog },
            featureFlags: { ...settings.featureFlags, ...newSettings.featureFlags },
            global_ui_settings: { ...settings.global_ui_settings, ...newSettings.global_ui_settings },
        };

        setSettings(updatedSettings); // Optimistic update

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSettings),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Failed to save settings.");
            const savedData = await res.json();
            setSettings(savedData); // Update with server response
            log('Global settings saved successfully.');
            addNotification({ type: 'success', title: 'Settings Saved', message: 'Your global settings have been updated.' });
        } catch (error) {
            log('Failed to save settings.', { error: (error as Error).message }, 'error');
            addNotification({ type: 'error', title: 'Save Failed', message: (error as Error).message });
            loadSettings(); // Revert on failure
            throw error;
        }
    }, [log, settings, loadSettings, addNotification]);

    const changeMessageFontSize = useCallback((direction: 'increase' | 'decrease') => {
        if (!settings) return;
        const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
        const currentSize = settings.global_ui_settings.messageFontSize || 'sm';
        const currentIndex = sizes.indexOf(currentSize);

        let newIndex = currentIndex;
        if (direction === 'increase') {
            newIndex = Math.min(sizes.length - 1, currentIndex + 1);
        } else {
            newIndex = Math.max(0, currentIndex - 1);
        }
        
        if (newIndex !== currentIndex) {
            const newUiSettings = {
                ...settings.global_ui_settings,
                messageFontSize: sizes[newIndex],
            };
            saveSettings({ global_ui_settings: newUiSettings });
        }

    }, [settings, saveSettings]);

    return (
        <SettingsContext.Provider value={{ settings, saveSettings, changeMessageFontSize }}>
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
