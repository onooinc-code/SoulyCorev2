

"use client";

import React from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { PowerIcon, DevicePhoneMobileIcon, EyeSlashIcon, CircleStackIcon } from '@/components/Icons';

const SidebarToolbar = ({ isMinimized }: { isMinimized: boolean }) => {
    const { 
        isContextMenuEnabled, 
        toggleContextMenu,
        isMobileView,
        toggleMobileView,
        isZenMode,
        toggleZenMode,
        setDataGridWidgetOpen
    } = useUIState();

    const buttonClass = "w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors";

    return (
        <div className={`p-2 mt-auto border-t border-gray-700/50 ${isMinimized ? 'flex flex-col items-center gap-2' : 'space-y-1'}`}>
            <button
                onClick={() => setDataGridWidgetOpen(true)}
                title="Open Data Grid Status Widget"
                className={`${buttonClass} text-gray-300 hover:bg-gray-700`}
            >
                <CircleStackIcon className="w-5 h-5 flex-shrink-0" />
                {!isMinimized && (
                    <span className="flex-1 text-left">
                        Data Grid Status
                    </span>
                )}
            </button>
            <button
                onClick={toggleContextMenu}
                title={isContextMenuEnabled ? "Disable Context Menu" : "Enable Context Menu"}
                className={`${buttonClass} ${isContextMenuEnabled ? 'text-gray-300 hover:bg-gray-700' : 'text-red-400 bg-red-900/30 hover:bg-red-900/50'}`}
            >
                <PowerIcon className={`w-5 h-5 flex-shrink-0 ${isContextMenuEnabled ? '' : 'text-red-500'}`} />
                {!isMinimized && (
                    <span className="flex-1 text-left">
                        Right-Click Menu
                    </span>
                )}
            </button>
            <button
                onClick={toggleMobileView}
                title={isMobileView ? "Switch to Desktop View" : "Switch to Mobile View"}
                className={`${buttonClass} ${isMobileView ? 'text-indigo-300 bg-indigo-900/50 hover:bg-indigo-900/80' : 'text-gray-300 hover:bg-gray-700'}`}
            >
                <DevicePhoneMobileIcon className="w-5 h-5 flex-shrink-0" />
                {!isMinimized && (
                    <span className="flex-1 text-left">
                        Mobile View
                    </span>
                )}
            </button>
             <button
                onClick={toggleZenMode}
                title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                className={`${buttonClass} ${isZenMode ? 'text-indigo-300 bg-indigo-900/50 hover:bg-indigo-900/80' : 'text-gray-300 hover:bg-gray-700'}`}
            >
                <EyeSlashIcon className="w-5 h-5 flex-shrink-0" />
                {!isMinimized && (
                    <span className="flex-1 text-left">
                        Zen Mode
                    </span>
                )}
            </button>
        </div>
    );
};

export default SidebarToolbar;