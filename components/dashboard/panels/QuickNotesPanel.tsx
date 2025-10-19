
"use client";

import React, { useState } from 'react';
import DashboardPanel from '../DashboardPanel';

const QuickNotesPanel = () => {
    const [note, setNote] = useState('');

    return (
        <DashboardPanel title="Quick Notes">
            <div className="flex flex-col h-full">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Jot down a quick note..."
                    className="w-full flex-1 bg-gray-900/50 text-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button className="mt-2 w-full text-center py-2 text-xs bg-indigo-600/50 hover:bg-indigo-600/80 rounded-md font-semibold transition-colors">
                    Save Note (Coming Soon)
                </button>
            </div>
        </DashboardPanel>
    );
};

export default QuickNotesPanel;
