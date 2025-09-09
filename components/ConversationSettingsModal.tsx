"use client";

import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from './providers/AppProvider';
import { useLog } from './providers/LogProvider';

// Per Gemini SDK guidelines, only this model should be used for this task.
const geminiModels = [
    'gemini-2.5-flash',
];

// FIX: Added interface for component props to resolve TypeScript error.
interface ConversationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ConversationSettingsModal = ({ isOpen, onClose }: ConversationSettingsModalProps) => {
    const { currentConversation, updateCurrentConversation, setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [model, setModel] = useState(geminiModels[0]);
    const [temperature, setTemperature] = useState(0.7);
    const [topP, setTopP] = useState(0.95);

    useEffect(() => {
        if (isOpen && currentConversation) {
            setModel(currentConversation.model || geminiModels[0]);
            setTemperature(currentConversation.temperature ?? 0.7);
            setTopP(currentConversation.topP ?? 0.95);
        }
    }, [isOpen, currentConversation]);

    const handleSave = async () => {
        if (!currentConversation) return;
        clearError();

        const updatedData = { model, temperature, topP };
        log('User clicked "Save" in Conversation Settings Modal', { conversationId: currentConversation.id, updatedData });

        try {
            const res = await fetch(`/api/conversations/${currentConversation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) throw new Error('Failed to update model settings');
            
            updateCurrentConversation(updatedData);
            onClose();

        } catch(error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to save conversation model settings', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    };

    return (
       <AnimatePresence>
            {isOpen && currentConversation && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Conversation Model Settings</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-2">
                                These settings apply only to this conversation. Default settings for new chats can be changed in Global Settings.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="modelName" className="block text-sm font-medium text-gray-400 mb-1">Model Name</label>
                            <select 
                                id="modelName" 
                                value={model} 
                                onChange={e => setModel(e.target.value)} 
                                className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                {geminiModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="temperature" className="block text-sm font-medium text-gray-400">Temperature: {temperature.toFixed(2)}</label>
                            <input id="temperature" type="range" min="0" max="1" step="0.01" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="topP" className="block text-sm font-medium text-gray-400">Top P: {topP.toFixed(2)}</label>
                            <input id="topP" type="range" min="0" max="1" step="0.01" value={topP} onChange={e => setTopP(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConversationSettingsModal;
