"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useAppControls } from '@/lib/hooks/useAppControls';

// Dynamically import all global modals to avoid pulling them all into the initial bundle.
const CommandPalette = dynamic(() => import('@/components/CommandPalette'));
const BookmarksModal = dynamic(() => import('@/components/BookmarksModal'));
const GlobalSettingsModal = dynamic(() => import('@/components/GlobalSettingsModal'));
const ShortcutsModal = dynamic(() => import('@/components/ShortcutsModal'));
const AddKnowledgeModal = dynamic(() => import('@/components/AddKnowledgeModal'));
const HardResetModal = dynamic(() => import('@/components/HardResetModal'));
const ResponseViewerModal = dynamic(() => import('@/components/ResponseViewerModal'));


const GlobalModals = () => {
    const {
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isBookmarksModalOpen,
        setBookmarksModalOpen,
        isGlobalSettingsModalOpen,
        setGlobalSettingsModalOpen,
        isShortcutsModalOpen,
        setShortcutsModalOpen,
        isAddKnowledgeModalOpen,
        setAddKnowledgeModalOpen,
        isHardResetModalOpen,
        setHardResetModalOpen,
        isResponseViewerModalOpen,
        setResponseViewerModalOpen,
    } = useUIState();

    const { restartApp } = useAppControls({ setHardResetModalOpen });


    return (
        <>
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
            />
            {isBookmarksModalOpen && (
                <BookmarksModal
                    isOpen={isBookmarksModalOpen}
                    setIsOpen={setBookmarksModalOpen}
                />
            )}
             {isGlobalSettingsModalOpen && (
                <GlobalSettingsModal
                    setIsOpen={setGlobalSettingsModalOpen}
                />
            )}
             {isShortcutsModalOpen && (
                <ShortcutsModal
                    isOpen={isShortcutsModalOpen}
                    onClose={() => setShortcutsModalOpen(false)}
                />
            )}
            {isAddKnowledgeModalOpen && (
                 <AddKnowledgeModal
                    isOpen={isAddKnowledgeModalOpen}
                    onClose={() => setAddKnowledgeModalOpen(false)}
                />
            )}
             {isHardResetModalOpen && (
                <HardResetModal
                    isOpen={isHardResetModalOpen}
                    onClose={() => setHardResetModalOpen(false)}
                    onComplete={() => window.location.reload()}
                />
            )}
            {isResponseViewerModalOpen && (
                <ResponseViewerModal
                    isOpen={isResponseViewerModalOpen}
                    onClose={() => setResponseViewerModalOpen(false)}
                />
            )}
        </>
    );
};

export default GlobalModals;
