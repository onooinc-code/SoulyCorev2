
"use client";

import { useCallback } from 'react';
import { useLog } from '@/components/providers/LogProvider';

export const useAppControls = () => {
    const { log } = useLog();

    const softRefreshApp = useCallback(() => {
        log('User initiated app soft refresh.');
        window.location.reload();
    }, [log]);

    const hardRefreshApp = useCallback(() => {
        log('User initiated app hard refresh.');
        // The 'true' argument forces a reload from the server, bypassing the cache.
        // This is non-standard and can cause type errors. The standard method is sufficient for a hard refresh in modern browsers.
        window.location.reload();
    }, [log]);

    const exitApp = useCallback(() => {
        log('User initiated app exit.');
        // Note: window.close() has limitations and may not work in all browsers/contexts.
        window.close();
    }, [log]);

    return {
        softRefreshApp,
        hardRefreshApp,
        exitApp,
    };
};
