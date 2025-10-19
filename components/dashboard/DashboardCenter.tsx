
"use client";

import React from 'react';
import DashboardPanel from './DashboardPanel';

// Import existing panels from their new location
import HeaderPanel from './panels/HeaderPanel';
import HedraGoalsPanel from './panels/HedraGoalsPanel';
import StatsPanel from './panels/StatsPanel';
import ActionsPanel from './panels/ActionsPanel';
import DocumentationPanel from './panels/DocumentationPanel';

// Import new placeholder panels
import RecentActivityPanel from './panels/RecentActivityPanel';
import QuickNotesPanel from './panels/QuickNotesPanel';
import SystemHealthPanel from './panels/SystemHealthPanel';
import AgentsStatusPanel from './panels/AgentsStatusPanel';
import QuickLinksPanel from './panels/QuickLinksPanel';
import LiveLogsPanel from './panels/LiveLogsPanel';
import TasksSummaryPanel from './panels/TasksSummaryPanel';


const DashboardCenter = () => {
    return (
        <div className="w-full h-full flex flex-col bg-gray-900">
            <header className="flex-shrink-0 p-4 border-b border-gray-700/50">
                <h2 className="text-xl font-bold">Dashboard Center</h2>
            </header>
            
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-12 gap-6">
                    {/* Row 1: Full Width Header */}
                    <div className="col-span-12">
                        <HeaderPanel />
                    </div>

                    {/* Row 2: Statistics */}
                    <div className="col-span-12">
                        <StatsPanel />
                    </div>

                    {/* Row 3: Main Goals & Recent Activity */}
                    <div className="col-span-12 lg:col-span-8">
                        <HedraGoalsPanel />
                    </div>
                    <div className="col-span-12 lg:col-span-4">
                        <RecentActivityPanel />
                    </div>
                    
                    {/* Row 4: Documentation & Quick Notes */}
                    <div className="col-span-12 lg:col-span-7">
                        <DocumentationPanel />
                    </div>
                    <div className="col-span-12 lg:col-span-5">
                        <QuickNotesPanel />
                    </div>

                    {/* Row 5: System Status Widgets */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3">
                        <SystemHealthPanel />
                    </div>
                    <div className="col-span-12 md:col-span-6 lg:col-span-3">
                        <AgentsStatusPanel />
                    </div>
                     <div className="col-span-12 md:col-span-6 lg:col-span-3">
                       <TasksSummaryPanel />
                    </div>
                     <div className="col-span-12 md:col-span-6 lg:col-span-3">
                       <QuickLinksPanel />
                    </div>
                    
                     {/* Row 6: Actions & Logs */}
                    <div className="col-span-12 lg:col-span-8">
                         <ActionsPanel />
                    </div>
                     <div className="col-span-12 lg:col-span-4">
                        <LiveLogsPanel />
                    </div>

                </div>
            </main>

            <footer className="p-2 border-t border-gray-700/50 text-center text-xs text-gray-500 flex-shrink-0">
                SoulyCore Dashboard v2.0
            </footer>
        </div>
    );
};

export default DashboardCenter;
