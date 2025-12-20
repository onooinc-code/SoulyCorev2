
"use client";

import React from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { CpuChipIcon } from './Icons';

const AppStatusBar = () => {
    const { backgroundTaskCount } = useConversation();

    const dbStatus = 'Connected'; 

    return (
        // FIX: Removed 'fixed bottom-0 left-0 right-0' to prevent overlapping with the sidebar.
        // It now acts as a standard block element at the bottom of its flex container.
        <div className="w-full h-8 bg-gray-900 border-t border-white/10 flex items-center justify-between px-4 text-xs text-gray-400 shrink-0 z-30">
            <div className="flex items-center gap-4">
                 <div>
                    <span>DB Status: </span>
                    <span className="text-green-400 font-semibold">{dbStatus}</span>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                {backgroundTaskCount > 0 && (
                     <div className="flex items-center gap-1.5 text-yellow-400 animate-pulse">
                        <CpuChipIcon className="w-4 h-4" />
                        <span>{backgroundTaskCount} Background Task(s) Running</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppStatusBar;
