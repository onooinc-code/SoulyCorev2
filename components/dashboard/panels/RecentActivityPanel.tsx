
"use client";

import React from 'react';
import DashboardPanel from '../DashboardPanel';

const RecentActivityPanel = () => {
    // Placeholder data
    const activities = [
        { id: 1, type: 'chat', text: 'New conversation: "Q3 Marketing Strategy"', time: '2m ago' },
        { id: 2, type: 'memory', text: 'Added 3 new entities from chat.', time: '15m ago' },
        { id: 3, type: 'agent', text: 'Agent run "Competitor Analysis" completed.', time: '1h ago' },
        { id: 4, type: 'docs', text: 'Documentation "API Reference" was updated.', time: '3h ago' },
        { id: 5, type: 'settings', text: 'Global settings were updated.', time: 'Yesterday' },
    ];

    return (
        <DashboardPanel title="Recent Activity">
            <div className="space-y-3">
                {activities.map(activity => (
                    <div key={activity.id} className="text-sm">
                        <p className="text-gray-300">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                ))}
            </div>
        </DashboardPanel>
    );
};

export default RecentActivityPanel;
