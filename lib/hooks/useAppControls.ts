// lib/hooks/useAppControls.ts
"use client";

import { useCallback } from 'react';
import { useLog } from '@/components/providers/LogProvider';

interface UseAppControlsProps {
    setHardResetModalOpen: (isOpen: boolean) => void;
}

export const useAppControls = ({ setHardResetModalOpen }: UseAppControlsProps) => {
    const { log } = useLog();

    const restartApp = useCallback(() => {
        log('User initiated app hard reset sequence.');
        setHardResetModalOpen(true);
        // The onComplete of the modal will handle the actual reload.
    }, [log, setHardResetModalOpen]);

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