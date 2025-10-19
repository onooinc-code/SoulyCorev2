"use client";

import React from 'react';
import { RocketLaunchIcon } from '@/components/Icons';
import EmptyState from '@/components/ui/EmptyState';

const ProjectsHub = () => {
    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <EmptyState 
                icon={RocketLaunchIcon}
                title="Projects Hub"
                description="This feature is currently under construction and will be available in a future update."
            />
        </div>
    );
};

export default ProjectsHub;
