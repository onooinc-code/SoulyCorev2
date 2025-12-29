
"use client";

import React, { useState, useEffect } from 'react';
import { XIcon, UserCircleIcon, BrainIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
import { useAppContext } from '@/lib/hooks/useAppContext';
import { Conversation, Brain } from '@/lib/types';

const MotionDiv = motion.div as any;

interface AgentConfigModalProps {
    onClose: () => void;
    conversation: Conversation | null;
}

const personas = [
    { name: 'Default Assistant', prompt: 'You are a helpful AI assistant.' },
    { name: 'Senior Developer', prompt: 'You are an expert Senior Software Engineer. You write clean, efficient, type-safe code. You prefer functional patterns and explain complex concepts simply.' },
    { name: 'Creative Writer', prompt: 'You are a creative writer with a flair for descriptive language and storytelling. You avoid cliches.' },
    { name: 'Business Analyst', prompt: 'You are a strategic business analyst. Focus on ROI, market trends, and actionable insights. Be concise and professional.' }
];

const AgentConfigModal = ({ onClose, conversation }: AgentConfigModalProps) => {
    const { updateCurrentConversation, addNotification } = useAppContext();
    const [systemPrompt, setSystemPrompt] = useState('');
    const [brainId, setBrainId] = useState<string | null>(null);
    const [brains, setBrains] = useState<Brain[]>([]);
    
    // New Settings
    const [extractionStrategy, setExtractionStrategy] = useState<'default' | 'single-shot' | 'background'>('default');
    const [extractionModel, setExtractionModel] = useState<string>('default');
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [brainsRes, modelsRes] = await Promise.all([
                    fetch('/api/brains'),
                    fetch('/api/models')
                ]);
                if(brainsRes.ok) setBrains(await brainsRes.json());
                if(modelsRes.ok) setAvailableModels(await modelsRes.json());
            } catch (error) { console.error(error); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (conversation) {
            setSystemPrompt(conversation.systemPrompt || '');
            setBrainId(conversation.brainId || null);
            
            // Load overrides from uiSettings
            const uiSettings = conversation.uiSettings || {};
            setExtractionStrategy(uiSettings.extractionStrategy || 'default');
            setExtractionModel(uiSettings.extractionModel || 'default');
        }
    }, [conversation]);

    const handleSave = () => {
        if (!conversation) return;
        
        const newUiSettings = {
            ...(conversation.uiSettings || {}),
            extractionStrategy: extractionStrategy === 'default' ? undefined : extractionStrategy,
            extractionModel: extractionModel === 'default' ? undefined : extractionModel,
        };

        updateCurrentConversation({
            systemPrompt,
            brainId: brainId === 'none' ? null : brainId,
            uiSettings: newUiSettings
        });
        addNotification({ type: 'success', title: 'Agent Updated', message: 'System instructions and memory config saved.' });
        onClose();
    };

    return (
        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <MotionDiv initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e: any) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><UserCircleIcon className="w-5 h-5 text-indigo-400"/> Agent Configuration</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div>
                         <label className="text-sm font-medium text-gray-300 mb-2 block">Load Persona</label>
                         <div className="flex flex-wrap gap-2">
                            {personas.map(p => (
                                <button key={p.name} onClick={() => setSystemPrompt(p.prompt)} className="px-3 py-1 bg-gray-700 hover:bg-indigo-600/50 rounded-full text-xs transition-colors border border-white/5">
                                    {p.name}
                                </button>
                            ))}
                         </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-1 block">System Instructions</label>
                        <textarea
                            value={systemPrompt}
                            onChange={e => setSystemPrompt(e.target.value)}
                            placeholder="Define how the AI should behave..."
                            className="w-full p-3 bg-gray-900 rounded-lg text-sm min-h-[120px] focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                         <label className="text-sm font-medium text-gray-300 mb-1 block">Active Brain (Memory Context)</label>
                         <select value={brainId || 'none'} onChange={e => setBrainId(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm">
                            <option value="none">No Specific Brain (General)</option>
                            {brains.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                    </div>

                    <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-lg space-y-4">
                        <h4 className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-2"><BrainIcon className="w-4 h-4"/> Memory Strategy Overrides</h4>
                        
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Extraction Strategy</label>
                            <select value={extractionStrategy} onChange={e => setExtractionStrategy(e.target.value as any)} className="w-full p-2 bg-gray-900 rounded text-sm border border-gray-700">
                                <option value="default">Use Global Default</option>
                                <option value="single-shot">Single-Shot (Integrated)</option>
                                <option value="background">Background Task</option>
                            </select>
                        </div>
                        
                         {extractionStrategy === 'background' && (
                             <div>
                                <label className="text-xs text-gray-400 block mb-1">Extraction Model</label>
                                <select value={extractionModel} onChange={e => setExtractionModel(e.target.value)} className="w-full p-2 bg-gray-900 rounded text-sm border border-gray-700">
                                    <option value="default">Use Global Default</option>
                                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                         )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">Save Configuration</button>
                </div>
            </MotionDiv>
        </MotionDiv>
    );
};

export default AgentConfigModal;
