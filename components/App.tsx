
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useConversation } from './providers/ConversationProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { AnimatePresence } from 'framer-motion';

import MobileApp from './MobileApp';
import DesktopApp from './DesktopApp';
import GlobalModals from './modals/GlobalModals';
import MorningBriefing from './MorningBriefing';
import UniversalProgressIndicator from './UniversalProgressIndicator';
import Notifications from './Notifications';
import TopProgressBar from './TopProgressBar';

export const App = () => {
    const { 
        isMobileView,
        setCommandPaletteOpen
    } = useUIState();

    const { backgroundTaskCount } = useConversation();
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);

    const shortcuts = useMemo(() => ({
        'mod+k': () => setCommandPaletteOpen(prev => !prev),
    }), [setCommandPaletteOpen]);
    useKeyboardShortcuts(shortcuts);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('lastVisit');
        if (lastVisit !== today) {
            const timer = setTimeout(() => setIsBriefingOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
            <TopProgressBar />
            <AnimatePresence>{backgroundTaskCount > 0 && <UniversalProgressIndicator />}</AnimatePresence>
            
            {/* 🖥️ DEVICE SWITCHER LOGIC */}
            {isMobileView ? <MobileApp /> : <DesktopApp />}

            <GlobalModals />
            <AnimatePresence>
                {isBriefingOpen && <MorningBriefing onClose={() => setIsBriefingOpen(false)} />}
            </AnimatePresence>
            <Notifications />
        </div>
    );
};
