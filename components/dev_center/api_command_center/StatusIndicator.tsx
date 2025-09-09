"use client";

import React from 'react';
import type { ApiTestStatus } from '@/lib/types';

interface StatusIndicatorProps {
    status: ApiTestStatus;
}

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
    const colorMap: Record<ApiTestStatus, string> = {
        'Passed': 'bg-green-500',
        'Failed': 'bg-red-500',
        'Not Run': 'bg-gray-500',
    };

    const titleMap: Record<ApiTestStatus, string> = {
        'Passed': 'Last test passed',
        'Failed': 'Last test failed',
        'Not Run': 'Not yet tested',
    };

    return (
        <div 
            className={`w-2.5 h-2.5 rounded-full ${colorMap[status]}`} 
            title={titleMap[status]}
        />
    );
};

export default StatusIndicator;