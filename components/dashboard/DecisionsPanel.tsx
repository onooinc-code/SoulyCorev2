"use client";

import React from 'react';
import { WarningIcon } from '../Icons';

const DecisionsPanel = () => {
    // Placeholder data
    const decisions = [
        { id: 1, title: "Resolve Memory Conflict", description: "New information about 'Project Titan' conflicts with existing data. Review needed." },
        { id: 2, title: "Approve New Tool", description: "(Mock) A new community tool 'Image Optimizer' is pending security review and approval." },
        { id: 3, title: "High Cost Alert", description: "(Mock) API usage for the 'Summarization' agent has exceeded its monthly budget. Action required." },
        { id: 4, title: "Stale Knowledge Pruning", description: "(Mock) 52 knowledge entries haven't been accessed in over a year. Approve archiving." },
        { id: 5, title: "Model Update Available", description: "(Mock) A new version of the base model is available. Approve rollout to production." },
        { id: 6, title: "Unrecognized Entity", description: "(Mock) The term 'Project Chimera' was mentioned frequently. Should this be a new entity?" },
        { id: 7, title: "Permission Request", description: "(Mock) A workflow requires access to your Google Calendar. Approve or deny." },
        { id: 8, title: "Low Test Coverage", description: "(Mock) The 'Reporting' feature has less than 50% test coverage. Prioritize new tests?" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {decisions.map(decision => (
                 <div key={decision.id} className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-lg flex flex-col justify-between h-36">
                    <div>
                        <div className="flex items-start gap-3">
                            <WarningIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-300 text-sm">{decision.title}</h4>
                                <p className="text-xs text-yellow-400/80 mt-1">{decision.description}</p>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end gap-2 mt-2">
                        <button className="px-3 py-1 bg-yellow-600 text-xs rounded-md hover:bg-yellow-500">Review</button>
                    </div>
                 </div>
            ))}
             {decisions.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4 md:col-span-4">No pending decisions.</p>
            )}
        </div>
    );
};

export default DecisionsPanel;