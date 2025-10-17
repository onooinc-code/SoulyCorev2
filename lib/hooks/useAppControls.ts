
"use client";

import { useCallback } from 'react';
import { useLog } from '@/components/providers/LogProvider';

export const useAppControls = () => {
    const { log } = useLog();

    const restartApp = useCallback(() => {
        log('User initiated app restart.');
        window.location.reload();
    }, [log]);

    const exitApp = useCallback(() => {
        log('User initiated app exit.');
        // Note: window.close() has limitations and may not work in all browsers/contexts.
        window.close();
    }, [log]);

    return {
        restartApp,
        exitApp,
    };
};
