

"use client";

import React, { useState, useEffect } from 'react';
// FIX: Corrected a relative import path for the `XIcon` component to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { XIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
import { useSettings } from './providers/SettingsProvider';
import { useConversation } from './providers/ConversationProvider';
import type { AppSettings } from '@/lib/types';
import { useLog } from './providers/LogProvider';

type Theme = 'theme-dark' | 'theme-light' | 'theme-solarized';

const GlobalSettingsModal = ({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void; }) => {
    const { settings, saveSettings, setTheme } = useSettings();
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        if (settings) {
            setLocalSettings(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings]);
    
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models');
                if (!res.ok) throw new Error("Failed to fetch models");
                const data = await res.json();
                setAvailableModels(data);
            } catch (error) {
                log('Failed to fetch available models for global settings', { error }, 'error');
            }
        };
        fetchModels();
    }, [log]);


    const handleSave = async () => {
        if (!localSettings) return;
        clearError();
        setStatus({ currentAction: "Saving settings..." });
        log('User clicked "Save" in Global Settings', { settings: localSettings });
        try {
            await saveSettings(localSettings);
            log('Global settings saved successfully.');
            setIsOpen(false);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to save settings.', { error: { message: errorMessage } }, 'error');
        } finally {
            setStatus({ currentAction: "" });
        }
    };

    const handleSettingChange = (path: string, value: any) => {
        setLocalSettings(prev => {
            if (!prev) return null;
            const keys = path.split('.');
            const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };
    
    const handleThemeChange = (theme: Theme) => {
        setTheme(theme);
        handleSettingChange('global_ui_settings.theme', theme);
    }

    const renderContent = () => {
        if (!localSettings) {
            return (
                <div className="flex justify-center items-center p-8">
                    <p className="text-gray-400">Loading current settings...</p>
                </div>
            );
        }
        
        const currentTheme = localSettings.global_ui_settings?.theme || 'theme-dark';

        return (
            <>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Theming */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Appearance</h3>
                         <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleThemeChange('theme-dark')} className={`p-3 rounded-lg border-2 ${currentTheme === 'theme-dark' ? 'border-indigo-500' : 'border-gray-700'}`}>
                                <div className="w-full h-12 bg-[#111827] rounded-md mb-2"></div>
                                <span className="text-sm">Dark</span>
                            </button>
                             <button onClick={() => handleThemeChange('theme-light')} className={`p-3 rounded-lg border-2 ${currentTheme === 'theme-light' ? 'border-indigo-500' : 'border-gray-700'}`}>
                                <div className="w-full h-12 bg-[#f3f4f6] rounded-md mb-2"></div>
                                <span className="text-sm">Light</span>
                            </button>
                             <button onClick={() => handleThemeChange('theme-solarized')} className={`p-3 rounded-lg border-2 ${currentTheme === 'theme-solarized' ? 'border-indigo-500' : 'border-gray-700'}`}>
                                <div className="w-full h-12 bg-[#002b36] rounded-md mb-2"></div>
                                <span className="text-sm">Solarized</span>
                            </button>
                         </div>
                    </div>

                    {/* Default Model Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Default Model Config</h3>
                        <p className="text-sm text-gray-400 mb-4">Settings applied to all new conversations.</p>
                        <div className="space-y-4">
                           <div>
                                <label htmlFor="defaultModel" className="block text-sm text-gray-400 mb-1">Model Name</label>
                                <select 
                                    id="defaultModel" 
                                    value={localSettings.defaultModelConfig.model} 
                                    onChange={e => handleSettingChange('defaultModelConfig.model', e.target.value)}
                                    className="w-full p-2 bg-gray-700 rounded-lg text-sm"
                                >
                                    {availableModels.length > 0 ? availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    )) : <option value={localSettings.defaultModelConfig.model}>{localSettings.defaultModelConfig.model}</option>}
                                </select>
                           </div>
                            <div>
                                <label htmlFor="defaultTemperature" className="block text-sm text-gray-400">Temperature: {localSettings.defaultModelConfig.temperature.toFixed(2)}</label>
                                <input id="defaultTemperature" type="range" min="0" max="1" step="0.01" value={localSettings.defaultModelConfig.temperature} onChange={e => handleSettingChange('defaultModelConfig.temperature', parseFloat(e.target.value))} className="w-full" />
                            </div>
                             <div>
                                <label htmlFor="defaultTopP" className="block text-sm text-gray-400">Top P: {localSettings.defaultModelConfig.topP.toFixed(2)}</label>
                                <input id="defaultTopP" type="range" min="0" max="1" step="0.01" value={localSettings.defaultModelConfig.topP} onChange={e => handleSettingChange('defaultModelConfig.topP', parseFloat(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Default Agent Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                         <h3 className="font-semibold text-lg mb-2">Default Agent Config</h3>
                        <label htmlFor="defaultSystemPrompt" className="sr-only">System Prompt</label>
                        <textarea id="defaultSystemPrompt" value={localSettings.defaultAgentConfig.systemPrompt} onChange={e => handleSettingChange('defaultAgentConfig.systemPrompt', e.target.value)} placeholder="System Prompt" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    </div>

                    {/* Feature Flags */}
                    {localSettings.featureFlags && (
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Feature Flags</h3>
                             <p className="text-sm text-gray-400 mb-4">Default settings for resource-intensive features in new conversations.</p>
                             <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={localSettings.featureFlags.enableMemoryExtraction} onChange={e => handleSettingChange('featureFlags.enableMemoryExtraction', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Enable Memory Extraction</span>
                                </label>
                                 <label className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={localSettings.featureFlags.enableProactiveSuggestions} onChange={e => handleSettingChange('featureFlags.enableProactiveSuggestions', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Enable Proactive Suggestions</span>
                                </label>
                                 <label className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={localSettings.featureFlags.enableAutoSummarization} onChange={e => handleSettingChange('featureFlags.enableAutoSummarization', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Enable Auto-Collapse Summaries</span>
                                </label>
                            </div>
                        </div>
                    )}


                     {/* Developer Settings */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Developer Settings</h3>
                        <label className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={localSettings.enableDebugLog.enabled} onChange={e => handleSettingChange('enableDebugLog.enabled', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                            <span>Enable Developer Logging</span>
                        </label>
                        <p className="text-xs text-gray-400 mt-2 pl-8">
                            When enabled, detailed logs for API calls and state changes will be saved. This may impact performance.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-6 mt-4 border-t border-gray-700">
                    <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm">Save Settings</button>
                </div>
            </>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-panel rounded-lg shadow-xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Global Settings</h2>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>
                {renderContent()}
            </motion.div>
        </motion.div>
    );
};

export default GlobalSettingsModal;