
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useLog } from '@/components/providers/LogProvider';

export const useDisplayModeManager = () => {
    const { log } = useLog();
    const [isMobileView, setIsMobileView] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleMobileView = useCallback(() => {
        log(`Toggling mobile view.`);
        setIsMobileView(prev => !prev);
    }, [log]);
    
    const toggleZenMode = useCallback(() => {
        log(`Toggling zen mode.`);
        setIsZenMode(prev => !prev);
    }, [log]);
    
    const toggleFullscreen = useCallback(() => {
        log(`Toggling fullscreen mode.`);
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                log('Fullscreen request failed', { error: err.message }, 'error');
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }, [log]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return {
        isMobileView,
        toggleMobileView,
        isZenMode,
        toggleZenMode,
        isFullscreen,
        toggleFullscreen,
    };
};
