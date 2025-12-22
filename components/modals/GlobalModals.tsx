
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useAppControls } from '@/lib/hooks/useAppControls';
import { AnimatePresence } from 'framer-motion';

// Dynamically import all global modals
const CommandPalette = dynamic(() => import('@/components/CommandPalette'));
const BookmarksModal = dynamic(() => import('@/components/BookmarksModal'));
const GlobalSettingsModal = dynamic(() => import('@/components/GlobalSettingsModal'));
const ShortcutsModal = dynamic(() => import('@/components/ShortcutsModal'));
const AddKnowledgeModal = dynamic(() => import('@/components/AddKnowledgeModal'));
const HardResetModal = dynamic(() => import('@/components/HardResetModal'));
const ResponseViewerModal = dynamic(() => import('@/components/ResponseViewerModal'));
const ToolInspectorModal = dynamic(() => import('@/components/modals/ToolInspectorModal'));
const MemoryInspectorModal = dynamic(() => import('@/components/modals/MemoryInspectorModal'));


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
        isToolInspectorOpen,
        setToolInspectorOpen,
        activeMemoryInspector,
        setMemoryInspector
    } = useUIState();

    return (
        <>
            <AnimatePresence>
                {isCommandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {isBookmarksModalOpen && <BookmarksModal onClose={() => setBookmarksModalOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {isGlobalSettingsModalOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsModalOpen} />}
            </AnimatePresence>
            <AnimatePresence>
                 {isShortcutsModalOpen && <ShortcutsModal onClose={() => setShortcutsModalOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {isAddKnowledgeModalOpen && <AddKnowledgeModal onClose={() => setAddKnowledgeModalOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                 {isHardResetModalOpen && <HardResetModal onClose={() => setHardResetModalOpen(false)} onComplete={() => window.location.reload()} />}
            </AnimatePresence>
            <AnimatePresence>
                {isResponseViewerModalOpen && <ResponseViewerModal onClose={() => setResponseViewerModalOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {isToolInspectorOpen && <ToolInspectorModal onClose={() => setToolInspectorOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {activeMemoryInspector && (
                    <MemoryInspectorModal 
                        tier={activeMemoryInspector} 
                        onClose={() => setMemoryInspector(null)} 
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default GlobalModals;
