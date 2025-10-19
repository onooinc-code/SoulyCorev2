// components/hubs/ExperiencesHub.tsx
"use client";

import React from 'react';
import EmptyState from '../ui/EmptyState';
import { BrainIcon } from '../Icons';

const ExperiencesHub = () => {
    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Experiences Hub</h2>
                <p className="text-sm text-gray-400">View synthesized insights and consolidated memories.</p>
            </header>
            <main className="flex-1 pt-6">
                <EmptyState
                    icon={BrainIcon}
                    title="Coming Soon: Experiences"
                    description="This hub will display higher-level insights and memories that the AI synthesizes over time from your conversations and data."
                />
            </main>
        </div>
    );
};

export default ExperiencesHub;
