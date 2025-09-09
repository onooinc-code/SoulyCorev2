

"use client";

import React from 'react';

// FIX: Removed React.FC to allow for proper type inference with framer-motion props.
const Dashboard = () => {
    // Placeholder functions for stats
    const getComponentCount = () => 25;
    const getHookCount = () => 5;
    const getTotalFiles = () => 40;

    const stats = [
        { label: "Component Count", value: getComponentCount() },
        { label: "Hook Count", value: getHookCount() },
        { label: "Total Files", value: getTotalFiles() },
        { label: "DB Stores", value: 6 },
    ];

    return (
        <div className="p-4 text-gray-300">
            <h3 className="text-2xl font-bold mb-4">Project Dashboard</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div>
                <h4 className="text-xl font-bold mb-3">GitHub Integration (Placeholder)</h4>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400">Connect to GitHub to see recent commits, open pull requests, and manage issues directly from SoulyCore.</p>
                    <button className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50" disabled>
                        Connect to GitHub
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;