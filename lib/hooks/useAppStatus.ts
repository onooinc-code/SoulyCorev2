
"use client";

import { useState, useCallback } from 'react';
import type { IStatus } from '@/lib/types';

/**
 * A custom hook to manage global application status indicators.
 * This includes loading states, error messages, and background task counts.
 */
export const useAppStatus = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setBaseStatus] = useState<IStatus>({ currentAction: '', error: null });
    const [backgroundTaskCount, setBackgroundTaskCount] = useState(0);

    /**
     * Updates the global status message and error state.
     */
    const setStatus = useCallback((newStatus: Partial<IStatus>) => {
        setBaseStatus(prev => ({ ...prev, ...newStatus }));
    }, []);

    /**
     * Clears any existing error message from the global status.
     */
    const clearError = useCallback(() => setStatus({ error: null }), [setStatus]);

    /**
     * Increments the background task counter, used for displaying a global progress indicator.
     */
    const startBackgroundTask = useCallback(() => setBackgroundTaskCount(prev => prev + 1), []);
    
    /**
     * Decrements the background task counter.
     */
    const endBackgroundTask = useCallback(() => setBackgroundTaskCount(prev => (prev > 0 ? prev - 1 : 0)), []);

    return {
        isLoading,
        setIsLoading,
        status,
        setStatus,
        clearError,
        backgroundTaskCount,
        startBackgroundTask,
        endBackgroundTask,
    };
};
