
"use client";

import React from 'react';
import { useConversation } from '@/components/providers/ConversationProvider';
import { CpuChipIcon } from './Icons';

const AppStatusBar = () => {
    const { backgroundTaskCount } = useConversation();

    const dbStatus = 'Connected'; // Placeholder for actual DB status check

    return (
        <div className="fixed bottom-0 left-0 right-0 h-6 bg-gray-800/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-4 text-xs text-gray-400 z-40">
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
