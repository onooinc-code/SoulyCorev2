// components/modals/GlobalModals.tsx
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '../providers/UIStateProvider';

// Dynamically import modals to avoid pulling them all into the initial bundle
const BookmarksModal = dynamic(() => import('../BookmarksModal'));
const GlobalSettingsModal = dynamic(() => import('../GlobalSettingsModal'));
const CommandPalette = dynamic(() => import('../CommandPalette'));
const ShortcutsModal = dynamic(() => import('../ShortcutsModal'));
const AddKnowledgeModal = dynamic(() => import('../AddKnowledgeModal'));
const HardResetModal = dynamic(() => import('../HardResetModal'));
const ResponseViewerModal = dynamic(() => import('../ResponseViewerModal'));


// This component is now a pure presenter, controlled entirely by the global UIStateProvider.
const GlobalModals = () => {
    const {
        isCommandPaletteOpen, setCommandPaletteOpen,
        isBookmarksModalOpen, setBookmarksModalOpen,
        isGlobalSettingsModalOpen, setGlobalSettingsModalOpen,
        isShortcutsModalOpen, setShortcutsModalOpen,
        isAddKnowledgeModalOpen, setAddKnowledgeModalOpen,
        isHardResetModalOpen, setHardResetModalOpen,
        isResponseViewerModalOpen, setResponseViewerModalOpen,
        restartApp,
    } = useUIState();

    return (
        <>
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
            
            {isBookmarksModalOpen && <BookmarksModal isOpen={isBookmarksModalOpen} setIsOpen={setBookmarksModalOpen} />}
            
            {isGlobalSettingsModalOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsModalOpen} />}
            
            {isShortcutsModalOpen && <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />}
            
            {isAddKnowledgeModalOpen && <AddKnowledgeModal isOpen={isAddKnowledgeModalOpen} onClose={() => setAddKnowledgeModalOpen(false)} />}
            
            {isHardResetModalOpen && <HardResetModal isOpen={isHardResetModalOpen} onClose={() => setHardResetModalOpen(false)} onComplete={() => window.location.reload()} />}

            {isResponseViewerModalOpen && <ResponseViewerModal isOpen={isResponseViewerModalOpen} onClose={() => setResponseViewerModalOpen(false)} />}
        </>
    );
};

export default GlobalModals;