
"use client";

import React, { useState, useEffect } from 'react';
import { XIcon, RefreshIcon } from '@/components/Icons';
import { motion } from 'framer-motion';
import { useAppContext } from '@/lib/hooks/useAppContext';

const ConversationSettingsModal = ({ onClose }: { onClose: () => void; }) => {
    const { currentConversation, updateCurrentConversation, addNotification } = useAppContext();
    
    const [model, setModel] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [topP, setTopP] = useState(0.95);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
            const res = await fetch('/api/models');
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setAvailableModels(data);
        } catch (error) {
            console.error(error);
             // Fallback
             setAvailableModels(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest']);
        } finally {
            setIsLoadingModels(false);
        }
    };

    useEffect(() => { fetchModels(); }, []);

    useEffect(() => {
        if (currentConversation) {
            setModel(currentConversation.model || 'gemini-2.5-flash');
            setTemperature(currentConversation.temperature ?? 0.7);
            setTopP(currentConversation.topP ?? 0.95);
        }
    }, [currentConversation]);

    const handleSave = () => {
        if (!currentConversation) return;
        const updatedData = { model, temperature, topP };
        updateCurrentConversation(updatedData);
        addNotification({ type: 'success', title: 'Saved', message: 'Settings updated for this chat.' });
        onClose();
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Conversation Model</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-400 hover:text-white"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                             <label className="text-sm font-medium text-gray-300">AI Model</label>
                             <button onClick={fetchModels} className="text-xs text-indigo-400 hover:text-white flex items-center gap-1"><RefreshIcon className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`}/> Refresh</button>
                        </div>
                        <select value={model} onChange={e => setModel(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm">
                            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Creativity (Temperature): {temperature}</label>
                        <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span onClick={() => setTemperature(0.2)} className="cursor-pointer hover:text-white">Precise</span>
                            <span onClick={() => setTemperature(0.7)} className="cursor-pointer hover:text-white">Balanced</span>
                            <span onClick={() => setTemperature(1.0)} className="cursor-pointer hover:text-white">Creative</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">Save Changes</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ConversationSettingsModal;
