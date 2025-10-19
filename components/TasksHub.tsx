// components/TasksHub.tsx
"use client";

import React from 'react';
import { TasksIcon } from '@/components/Icons';
import EmptyState from '@/components/ui/EmptyState';

const TasksHub = () => {
    // This is a placeholder component. A full implementation would involve
    // fetching tasks from `/api/tasks`, displaying them, and allowing for CRUD operations.
    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <EmptyState 
                icon={TasksIcon}
                title="Tasks Hub"
                description="This feature is currently under construction and will be available in a future update."
            />
        </div>
    );
};

export default TasksHub;
