
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, RefreshIcon, CheckIcon, CogIcon, CircleStackIcon } from '@/components/Icons';
import { useSettings } from '@/components/providers/SettingsProvider';
import { CognitiveTask, AiProvider } from '@/lib/types';
import { useNotification } from '@/lib/hooks/use-notifications';

interface CognitiveRoutingModalProps {
    onClose: () => void;
}

const taskLabels: Record<CognitiveTask, { label: string, desc: string }> = {
    main_response: { label: 'Main Response', desc: 'The core AI answer in chat turns.' },
    memory_extraction: { label: 'Memory Extraction', desc: 'Background harvesting of facts and entities.' },
    context_assembly: { label: 'Context Assembly', desc: 'Reasoning process for merging memory tiers.' },
    proactive_suggestions: { label: 'Proactive Logic', desc: 'Generating suggestions and next steps.' },
    synthesis: { label: 'Cognitive Synthesis', desc: 'Deep synthesis for reports and knowledge nexus.' },
    title_generation: { label: 'Auto-Naming', desc: 'Naming conversations based on history.' },
};

const providers: { id: AiProvider, label: string, color: string }[] = [
    { id: 'gemini-3-flash-preview', label: 'Balanced (Flash)', color: 'text-emerald-400' },
    { id: 'gemini-3-pro-preview', label: 'High-Logic (Pro)', color: 'text-indigo-400' },
    { id: 'external', label: 'External (Soon)', color: 'text-gray-500' },
];

const CognitiveRoutingModal = ({ onClose }: CognitiveRoutingModalProps) => {
    const { settings, saveSettings } = useSettings();
    const { addNotification } = useNotification();
    const [localRouting, setLocalRouting] = useState<Record<CognitiveTask, AiProvider> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings?.apiRouting) {
            setLocalRouting({ ...settings.apiRouting });
        }
    }, [settings]);

    const handleUpdateRoute = (task: CognitiveTask, provider: AiProvider) => {
        if (provider === 'external') {
            addNotification({ type: 'info', title: 'Coming Soon', message: 'External API integration is on the roadmap.' });
            return;
        }
        setLocalRouting(prev => prev ? ({ ...prev, [task]: provider }) : null);
    };

    const handleSave = async () => {
        if (!settings || !localRouting) return;
        setIsSaving(true);
        try {
            await saveSettings({ ...settings, apiRouting: localRouting });
            addNotification({ type: 'success', title: 'Routes Optimized', message: 'Cognitive pathways have been updated.' });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestoreDefaults = () => {
        setLocalRouting({
            main_response: 'gemini-3-flash-preview',
            memory_extraction: 'gemini-3-flash-preview',
            context_assembly: 'gemini-3-flash-preview',
            proactive_suggestions: 'gemini-3-flash-preview',
            synthesis: 'gemini-3-pro-preview',
            title_generation: 'gemini-3-flash-preview',
        });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/5 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <RefreshIcon className="w-5 h-5" />
                        </div>
                        <div>
                             <h2 className="text-lg font-bold text-white">Cognitive Routing Control</h2>
                             <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">API Dispatcher Logic</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </header>

                <main className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                        {localRouting && (Object.keys(taskLabels) as CognitiveTask[]).map(task => (
                            <div key={task} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                <div className="max-w-[60%]">
                                    <h4 className="text-sm font-bold text-gray-200">{taskLabels[task].label}</h4>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{taskLabels[task].desc}</p>
                                </div>
                                
                                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                    {providers.map(prov => (
                                        <button 
                                            key={prov.id}
                                            onClick={() => handleUpdateRoute(task, prov.id)}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                                localRouting[task] === prov.id 
                                                ? 'bg-indigo-600 text-white shadow-lg' 
                                                : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            {prov.label.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="p-4 bg-gray-800/30 border-t border-white/5 flex justify-between items-center">
                    <button 
                        onClick={handleRestoreDefaults}
                        className="text-[10px] font-bold text-gray-500 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshIcon className="w-3 h-3"/> Restore Defaults
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-xs font-bold rounded-lg text-gray-300">Cancel</button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Optimizing Paths...' : 'Apply & Save'}
                        </button>
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default CognitiveRoutingModal;
