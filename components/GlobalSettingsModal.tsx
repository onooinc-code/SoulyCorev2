
"use client";

import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import { motion } from 'framer-motion';
import { useSettings } from './providers/SettingsProvider';
import { useConversation } from './providers/ConversationProvider';
import type { AppSettings } from '@/lib/types';
import { useLog } from './providers/LogProvider';

interface GlobalSettingsModalProps {
    setIsOpen: (isOpen: boolean) => void;
}

const GlobalSettingsModal = ({ setIsOpen }: GlobalSettingsModalProps) => {
    const { settings, loadSettings, saveSettings } = useSettings();
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);

    // This effect runs once when the modal opens to ensure we have the latest settings.
    useEffect(() => {
        if (!settings) {
            loadSettings();
        }
    }, [settings, loadSettings]);

    // This effect synchronizes the local form state with the global context state.
    // It runs whenever the global settings object is updated (e.g., after the fetch).
    useEffect(() => {
        if (settings) {
            setLocalSettings(JSON.parse(JSON.stringify(settings))); // Deep copy
        }
    }, [settings]);

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
            log('Failed to save settings.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        } finally {
            setStatus({ currentAction: "" });
        }
    };

    const renderContent = () => {
        if (!localSettings) {
            return (
                <div className="flex justify-center items-center p-8">
                    <p className="text-gray-400">Loading current settings...</p>
                </div>
            );
        }

        return (
            <>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Default Model Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Default Model Config</h3>
                        <p className="text-sm text-gray-400 mb-4">Settings applied to all new conversations.</p>
                        <div className="space-y-4">
                            <label htmlFor="defaultModel" className="sr-only">Model Name</label>
                            <input id="defaultModel" name="defaultModel" type="text" value={localSettings.defaultModelConfig.model} onChange={e => setLocalSettings(s => s ? ({...s, defaultModelConfig: {...s.defaultModelConfig, model: e.target.value}}) : null)} placeholder="Model Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                            <div>
                                <label htmlFor="defaultTemperature" className="block text-sm text-gray-400">Temperature: {localSettings.defaultModelConfig.temperature.toFixed(2)}</label>
                                <input id="defaultTemperature" name="defaultTemperature" type="range" min="0" max="1" step="0.01" value={localSettings.defaultModelConfig.temperature} onChange={e => setLocalSettings(s => s ? ({...s, defaultModelConfig: {...s.defaultModelConfig, temperature: parseFloat(e.target.value)}}) : null)} className="w-full" />
                            </div>
                             <div>
                                <label htmlFor="defaultTopP" className="block text-sm text-gray-400">Top P: {localSettings.defaultModelConfig.topP.toFixed(2)}</label>
                                <input id="defaultTopP" name="defaultTopP" type="range" min="0" max="1" step="0.01" value={localSettings.defaultModelConfig.topP} onChange={e => setLocalSettings(s => s ? ({...s, defaultModelConfig: {...s.defaultModelConfig, topP: parseFloat(e.target.value)}}) : null)} className="w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Default Agent Config */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                         <h3 className="font-semibold text-lg mb-2">Default Agent Config</h3>
                        <label htmlFor="defaultSystemPrompt" className="sr-only">System Prompt</label>
                        <textarea id="defaultSystemPrompt" name="defaultSystemPrompt" value={localSettings.defaultAgentConfig.systemPrompt} onChange={e => setLocalSettings(s => s ? ({...s, defaultAgentConfig: {...s.defaultAgentConfig, systemPrompt: e.target.value}}) : null)} placeholder="System Prompt" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    </div>

                    {/* Feature Flags */}
                    {localSettings.featureFlags && (
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Feature Flags</h3>
                             <p className="text-sm text-gray-400 mb-4">Default settings for resource-intensive features in new conversations.</p>
                             <div className="space-y-3">
                                <label htmlFor="enableMemoryExtraction" className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                                    <input id="enableMemoryExtraction" name="enableMemoryExtraction" type="checkbox" checked={localSettings.featureFlags.enableMemoryExtraction} onChange={e => setLocalSettings(s => s ? ({...s, featureFlags: {...s.featureFlags, enableMemoryExtraction: e.target.checked }}) : null)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Enable Memory Extraction</span>
                                </label>
                                 <label htmlFor="enableProactiveSuggestions" className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                                    <input id="enableProactiveSuggestions" name="enableProactiveSuggestions" type="checkbox" checked={localSettings.featureFlags.enableProactiveSuggestions} onChange={e => setLocalSettings(s => s ? ({...s, featureFlags: {...s.featureFlags, enableProactiveSuggestions: e.target.checked }}) : null)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Enable Proactive Suggestions</span>
                                </label>
                                 <label htmlFor="enableAutoSummarization" className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                                    <input id="enableAutoSummarization" name="enableAutoSummarization" type="checkbox" checked={localSettings.featureFlags.enableAutoSummarization} onChange={e => setLocalSettings(s => s ? ({...s, featureFlags: {...s.featureFlags, enableAutoSummarization: e.target.checked }}) : null)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Enable Auto-Collapse Summaries</span>
                                </label>
                            </div>
                        </div>
                    )}


                     {/* Developer Settings */}
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Developer Settings</h3>
                        <label htmlFor="enableDebugLog" className="flex items-center gap-3 text-sm font-medium text-gray-300 cursor-pointer">
                            <input id="enableDebugLog" name="enableDebugLog" type="checkbox" checked={localSettings.enableDebugLog.enabled} onChange={e => setLocalSettings(s => s ? ({...s, enableDebugLog: { enabled: e.target.checked }}) : null)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
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
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
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
