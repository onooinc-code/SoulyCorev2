"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '../providers/UIStateProvider';

// Dynamically import modals to avoid pulling them all into the initial bundle
const BookmarksModal = dynamic(() => import('../BookmarksModal'));
const GlobalSettingsModal = dynamic(() => import('../GlobalSettingsModal'));
const CommandPalette = dynamic(() => import('../CommandPalette'));
const ShortcutsModal = dynamic(() => import('../ShortcutsModal'));
const AddKnowledgeModal = dynamic(() => import('../AddKnowledgeModal'));
const HardResetModal = dynamic(() => import('../HardResetModal'));

interface GlobalModalsProps {
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: (isOpen: boolean) => void;
}

// NOTE: This component's state management needs to be refactored and hoisted to a global UI context (UIStateProvider).
// For now, we'll manage the state locally to fix the build errors.
const GlobalModals = ({ isCommandPaletteOpen, setCommandPaletteOpen }: GlobalModalsProps) => {
    const [isBookmarksModalOpen, setBookmarksModalOpen] = useState(false);
    const [isGlobalSettingsModalOpen, setGlobalSettingsModalOpen] = useState(false);
    const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false);
    const [isAddKnowledgeModalOpen, setAddKnowledgeModalOpen] = useState(false);
    const [isHardResetModalOpen, setHardResetModalOpen] = useState(false);
    const { restartApp } = useUIState();

    // This component will eventually listen to global state to open modals.
    // The placeholder implementation uses local state. The right-click context menu
    // also needs to be wired up to these setters.

    return (
        <>
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

            {/* The following modals are placeholders until their triggers are fully implemented */}
            {isBookmarksModalOpen && <BookmarksModal isOpen={isBookmarksModalOpen} setIsOpen={setBookmarksModalOpen} />}
            {isGlobalSettingsModalOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsModalOpen} />}
            {isShortcutsModalOpen && <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />}
            {isAddKnowledgeModalOpen && <AddKnowledgeModal isOpen={isAddKnowledgeModalOpen} onClose={() => setAddKnowledgeModalOpen(false)} />}
            {isHardResetModalOpen && <HardResetModal isOpen={isHardResetModalOpen} onClose={() => setHardResetModalOpen(false)} onComplete={restartApp} />}
        </>
    );
};

export default GlobalModals;
