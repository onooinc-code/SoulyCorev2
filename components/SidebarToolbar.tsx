
"use client";

import React from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { PowerIcon } from '@/components/Icons';

const SidebarToolbar = ({ isMinimized }: { isMinimized: boolean }) => {
    const { isContextMenuEnabled, toggleContextMenu } = useUIState();

    return (
        <div className={`p-2 mt-auto border-t border-gray-700/50 ${isMinimized ? 'flex justify-center' : ''}`}>
            <button
                onClick={toggleContextMenu}
                title={isContextMenuEnabled ? "Disable Context Menu" : "Enable Context Menu"}
                className={`w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${isContextMenuEnabled ? 'text-gray-300 hover:bg-gray-700' : 'text-red-400 hover:bg-red-900/50'}`}
            >
                <PowerIcon className={`w-5 h-5 ${isContextMenuEnabled ? '' : 'text-red-500'}`} />
                {!isMinimized && (
                    <span className="flex-1 text-left">
                        Right-Click Menu: {isContextMenuEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                )}
            </button>
        </div>
    );
};

export default SidebarToolbar;
