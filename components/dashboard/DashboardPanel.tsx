"use client";

// FIX: Corrected a syntax error in the React import statement and added the missing `useState` import to resolve build errors.
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MinusIcon, PlusIcon, FullscreenIcon, ExitFullscreenIcon } from '../Icons';

interface DashboardPanelProps {
    title: string;
    children?: React.ReactNode;
    // Note: isCollapsedOverride is being deprecated in favor of local state
}

const DashboardPanel = ({ title, children }: DashboardPanelProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const content = (
        <div className={`glass-panel rounded-lg flex flex-col h-full ${isFullscreen ? 'p-6' : 'p-4'}`}>
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 text-gray-400 hover:text-white" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <ExitFullscreenIcon className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 text-gray-400 hover:text-white" title={isCollapsed ? "Expand Panel" : "Collapse Panel"}>
                        {isCollapsed ? <PlusIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
                    </button>
                </div>
            </header>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-1 overflow-auto min-h-0" // Added min-h-0 for flexbox correctness
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <>
            <motion.div layout className={`h-full ${isFullscreen ? 'hidden' : 'block'}`}>
                {content}
            </motion.div>
            <AnimatePresence>
                {isFullscreen && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900 z-[100] p-4"
                     >
                        <div className="w-full h-full">
                           {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DashboardPanel;