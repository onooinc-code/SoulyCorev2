// components/data_hub/MaintenancePanel.tsx
"use client";

import React, { useState } from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';
import { RefreshIcon } from '@/components/Icons';

const MaintenancePanel = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { addNotification } = useNotification();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        addNotification({ type: 'info', title: 'Refreshing Views', message: 'This may take a moment...' });
        try {
            const res = await fetch('/api/system/refresh-views', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to start refresh');
            addNotification({ type: 'success', title: 'Success', message: 'Materialized views have been refreshed.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Refresh Failed', message: (error as Error).message });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">System Maintenance</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-semibold">Materialized Views</h4>
                <p className="text-sm text-gray-400 mt-1 mb-4">
                    Refresh pre-calculated data views to improve query performance across the application. This is useful after large data imports or updates.
                </p>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                >
                    <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Views'}
                </button>
            </div>
        </div>
    );
};

export default MaintenancePanel;
