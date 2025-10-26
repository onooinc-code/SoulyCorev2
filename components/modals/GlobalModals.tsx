"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useAppControls } from '@/lib/hooks/useAppControls';
import { AnimatePresence } from 'framer-motion';

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
            <AnimatePresence>
                {isCommandPaletteOpen && (
                    <CommandPalette
                        onClose={() => setCommandPaletteOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isBookmarksModalOpen && (
                    <BookmarksModal
                        onClose={() => setBookmarksModalOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isGlobalSettingsModalOpen && (
                    <GlobalSettingsModal
                        setIsOpen={setGlobalSettingsModalOpen}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                 {isShortcutsModalOpen && (
                    <ShortcutsModal
                        onClose={() => setShortcutsModalOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isAddKnowledgeModalOpen && (
                     <AddKnowledgeModal
                        onClose={() => setAddKnowledgeModalOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                 {isHardResetModalOpen && (
                    <HardResetModal
                        onClose={() => setHardResetModalOpen(false)}
                        onComplete={() => window.location.reload()}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isResponseViewerModalOpen && (
                    <ResponseViewerModal
                        onClose={() => setResponseViewerModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default GlobalModals;