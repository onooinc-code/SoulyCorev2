"use client";

import React from 'react';
import { DocumentTextIcon } from '../Icons';

const ReportsPanel = () => {
    // Placeholder data
    const reports = [
        { id: 1, title: "Weekly Usage Summary", date: "2024-07-15" },
        { id: 2, title: "Memory Growth Analysis", date: "2024-07-14" },
        { id: 3, title: "Most Used Prompts", date: "2024-07-12" },
        { id: 4, title: "API Cost Breakdown", date: "2024-07-11" },
        { id: 5, title: "Q2 Feature Health Review", date: "2024-07-10" },
        { id: 6, title: "User Feedback Synthesis", date: "2024-07-09" },
        { id: 7, title: "Top Semantic Queries", date: "2024-07-08" },
        { id: 8, title: "Monthly Performance Metrics", date: "2024-07-01" },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {reports.map(report => (
                 <div key={report.id} className="bg-gray-900/50 p-4 rounded-lg flex flex-col justify-between h-36">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                            <h4 className="font-semibold text-gray-200 flex-1 text-sm">{report.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500">Generated: {report.date}</p>
                    </div>
                    <div className="flex justify-end mt-2">
                        <button className="px-3 py-1 bg-gray-700 text-xs rounded-md hover:bg-gray-600">View</button>
                    </div>
                 </div>
            ))}
             {reports.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4 md:col-span-4">No reports generated yet.</p>
            )}
        </div>
    );
};

export default ReportsPanel;