
"use client";

import React from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { CogIcon, BrainIcon } from './Icons';

interface StatusBarProps {
    onSettingsClick: () => void;
    onAgentConfigClick: () => void;
}

const StatusBar = ({ onSettingsClick, onAgentConfigClick }: StatusBarProps) => {
    const { currentConversation } = useConversation();

    if (!currentConversation) {
        return null;
    }

    const { model, temperature, topP } = currentConversation;

    return (
        <div className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700/50 p-2 text-xs text-gray-400">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <span>Model: <span className="font-semibold text-gray-300">{model || 'default'}</span></span>
                    <span>Temp: <span className="font-semibold text-gray-300">{temperature?.toFixed(2) || '0.70'}</span></span>
                    <span>Top-P: <span className="font-semibold text-gray-300">{topP?.toFixed(2) || '0.95'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onSettingsClick} className="flex items-center gap-1.5 hover:bg-gray-700/50 px-2 py-1 rounded-md transition-colors">
                        <CogIcon className="w-4 h-4" />
                        <span>Model Settings</span>
                    </button>
                    <button onClick={onAgentConfigClick} className="flex items-center gap-1.5 hover:bg-gray-700/50 px-2 py-1 rounded-md transition-colors">
                        <BrainIcon className="w-4 h-4" />
                        <span>Agent Config</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
