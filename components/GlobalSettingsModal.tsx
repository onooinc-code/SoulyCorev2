
"use client";

import React, { useState, useEffect } from 'react';
import { XIcon, BrainIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useConversation } from '@/components/providers/ConversationProvider';
import type { AppSettings } from '@/lib/types';

type Theme = 'theme-dark' | 'theme-light' | 'theme-solarized';
type MessageFontSize = 'xs' | 'sm' | 'base' | 'lg';

const GlobalSettingsModal = ({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void; }) => {
    const { settings, saveSettings, setTheme, changeGlobalFontSize } = useSettings();
    const { setStatus, clearError } = useConversation();
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        if (settings) {
            // Ensure memoryConfig exists
            const safeSettings = JSON.parse(JSON.stringify(settings));
            if (!safeSettings.memoryConfig) {
                safeSettings.memoryConfig = { extractionStrategy: 'single-shot', extractionModel: 'gemini-2.5-flash' };
            }
            setLocalSettings(safeSettings);
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
                console.error('Failed to fetch available models for global settings', { error });
            }
        };
        fetchModels();
    }, []);


    const handleSave = async () => {
        if (!localSettings) return;
        clearError();
        setStatus({ currentAction: "Saving settings..." });
        console.log('User clicked "Save" in Global Settings', { settings: localSettings });
        try {
            await saveSettings(localSettings);
            console.log('Global settings saved successfully.');
            setIsOpen(false);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            console.error('Failed to save settings.', { error: { message: errorMessage } });
        } finally {
            setStatus({ currentAction: "" });
        }
    };

    const handleSettingChange = (path: string, value: any) => {
        setLocalSettings(prev => {
            if (!prev) return null;
            const keys = path.split('.');
            const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current: any = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                // Create object if it doesn't exist (e.g. memoryConfig)
                if (!current[keys[i]]) current[keys[i]] = {};
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
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
                    
                    {/* Memory Architecture */}
                    <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <BrainIcon className="w-5 h-5 text-indigo-400"/> Memory Architecture
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">Configure how the AI learns and persists information.</p>
                        
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Extraction Strategy</label>
                                <select 
                                    value={localSettings.memoryConfig?.extractionStrategy || 'single-shot'}
                                    onChange={e => handleSettingChange('memoryConfig.extractionStrategy', e.target.value)}
                                    className="w-full p-2 bg-gray-800 rounded-lg text-sm border border-gray-700 focus:border-indigo-500 outline-none"
                                >
                                    <option value="single-shot">Single-Shot (Fast & Efficient)</option>
                                    <option value="background">Background Task (High Accuracy)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    <strong>Single-Shot:</strong> Replies and learns in one request (Save 50% API calls).<br/>
                                    <strong>Background:</strong> Replies fast, then runs a separate, more detailed model to learn.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Extraction Model (Background Only)</label>
                                <select 
                                    value={localSettings.memoryConfig?.extractionModel || 'gemini-2.5-flash'}
                                    onChange={e => handleSettingChange('memoryConfig.extractionModel', e.target.value)}
                                    className="w-full p-2 bg-gray-800 rounded-lg text-sm border border-gray-700 focus:border-indigo-500 outline-none"
                                    disabled={localSettings.memoryConfig?.extractionStrategy === 'single-shot'}
                                >
                                     {availableModels.length > 0 ? availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    )) : <option value="gemini-2.5-flash">gemini-2.5-flash</option>}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Default Model Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Default Chat Model</h3>
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
                        </div>
                    </div>

                    {/* Default Agent Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                         <h3 className="font-semibold text-lg mb-2">Default System Persona</h3>
                        <label htmlFor="defaultSystemPrompt" className="sr-only">System Prompt</label>
                        <textarea id="defaultSystemPrompt" value={localSettings.defaultAgentConfig.systemPrompt} onChange={e => handleSettingChange('defaultAgentConfig.systemPrompt', e.target.value)} placeholder="System Prompt" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    </div>

                     {/* Developer Settings */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Developer Settings</h3>
                        <label className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={localSettings.enableDebugLog.enabled} onChange={e => handleSettingChange('enableDebugLog.enabled', e.target.value)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                            <span>Enable Developer Logging</span>
                        </label>
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
