

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '../Icons';
import DashboardPanel from './DashboardPanel';
import HeaderPanel from './HeaderPanel';
import HedraGoalsPanel from './HedraGoalsPanel';
import StatsPanel from './StatsPanel';
import ActionsPanel from './ActionsPanel';
import DecisionsPanel from './DecisionsPanel';
import ReportsPanel from './ReportsPanel';
import DocumentationPanel from './DocumentationPanel';

const DashboardCenter = () => {
    // This state can be used to programmatically control all panels
    const [allPanelsCollapsed, setAllPanelsCollapsed] = useState<boolean | null>(null);

    const handleCollapseAll = () => {
        setAllPanelsCollapsed(true);
    };

    const handleExpandAll = () => {
        setAllPanelsCollapsed(false);
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-900">
            <header className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0">
                <h2 className="text-xl font-bold">Dashboard Center</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleExpandAll} className="px-3 py-1.5 bg-gray-700 text-xs rounded-md hover:bg-gray-600">Expand All</button>
                    <button onClick={handleCollapseAll} className="px-3 py-1.5 bg-gray-700 text-xs rounded-md hover:bg-gray-600">Collapse All</button>
                </div>
            </header>
            
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                <HeaderPanel />
                
                {/* FIX: The DashboardPanel component requires a 'children' prop. Passed the HedraGoalsPanel component as a child to satisfy this requirement. */}
                <DashboardPanel title="Hedra Strategic Goals" isCollapsedOverride={allPanelsCollapsed}>
                    <HedraGoalsPanel />
                </DashboardPanel>
                
                {/* FIX: The DashboardPanel component requires a 'children' prop. Passed the StatsPanel component as a child to satisfy this requirement. */}
                <DashboardPanel title="System Statistics" isCollapsedOverride={allPanelsCollapsed}>
                    <StatsPanel />
                </DashboardPanel>

                {/* FIX: The DashboardPanel component requires a 'children' prop. Passed the DocumentationPanel component as a child to satisfy this requirement. */}
                <DashboardPanel title="Project Documentations" isCollapsedOverride={allPanelsCollapsed}>
                    <DocumentationPanel />
                </DashboardPanel>
                {/* FIX: The DashboardPanel component requires a 'children' prop. Passed the ActionsPanel component as a child to satisfy this requirement. */}
                <DashboardPanel title="Action Center" isCollapsedOverride={allPanelsCollapsed}>
                    <ActionsPanel />
                </DashboardPanel>
                {/* FIX: The DashboardPanel component requires a 'children' prop. Passed the DecisionsPanel component as a child to satisfy this requirement. */}
                <DashboardPanel title="Needed Decisions" isCollapsedOverride={allPanelsCollapsed}>
                    <DecisionsPanel />
                </DashboardPanel>
                {/* FIX: The DashboardPanel component requires a 'children' prop. Passed the ReportsPanel component as a child to satisfy this requirement. */}
                <DashboardPanel title="Important Reports" isCollapsedOverride={allPanelsCollapsed}>
                    <ReportsPanel />
                </DashboardPanel>
            </main>

            <footer className="p-2 border-t border-gray-700/50 text-center text-xs text-gray-500 flex-shrink-0">
                SoulyCore Dashboard v1.0
            </footer>
        </div>
    );
};

export default DashboardCenter;