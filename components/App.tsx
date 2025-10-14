
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ChatWindow from '@/components/ChatWindow';
import MorningBriefing from '@/components/MorningBriefing';
import { XIcon, MemoryIcon, PlusIcon, TrashIcon, SparklesIcon, SidebarLeftIcon, LogIcon, UsersIcon, CodeIcon, BookmarkListIcon, SettingsIcon, FullscreenIcon, ExitFullscreenIcon, ClearIcon, KnowledgeIcon, KeyboardIcon, PromptsIcon, RefreshIcon, MinusIcon, BrainIcon, DashboardIcon, RocketLaunchIcon, ToolsIcon, TasksIcon, CopyIcon, ScissorsIcon, ClipboardPasteIcon, CircleStackIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useUIState } from '@/components/providers/UIStateProvider';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import dynamic from 'next/dynamic';
import LogOutputPanel from './LogOutputPanel';
import ContextMenu, { MenuItem } from './ContextMenu';
import UniversalProgressIndicator from './UniversalProgressIndicator';
import NavigationRail from './NavigationRail';
import ConversationPanel from './ConversationPanel';
import { getActionsRegistry } from '@/lib/actionsRegistry';

const ContactsHub = dynamic(() => import('@/components/ContactsHub'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Contacts Hub...</p></div>
});

const MemoryCenter = dynamic(() => import('@/components/MemoryCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Memory Center...</p></div>
});

const DevCenter = dynamic(() => import('@/components/dev_center/DevCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Dev Center...</p></div>
});

const BrainCenter = dynamic(() => import('@/components/brain_center/BrainCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Brain Center...</p></div>
});

const AgentCenter = dynamic(() => import('@/components/agent_center/AgentCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Agent Center...</p></div>
});

const DashboardCenter = dynamic(() => import('@/components/dashboard/DashboardCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Dashboard...</p></div>
});

const ToolsHub = dynamic(() => import('@/components/ToolsHub'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Tools Hub...</p></div>
});

const TasksHub = dynamic(() => import('@/components/TasksHub'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Tasks Hub...</p></div>
});

const DataHubCenter = dynamic(() => import('@/components/data_hub/DataHubCenter'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Data Hub...</p></div>
});

const DataHubWidget = dynamic(() => import('@/components/data_hub/DataHubWidget'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});


const BookmarksModal = dynamic(() => import('@/components/BookmarksModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Bookmarks...</p></div>
});
const GlobalSettingsModal = dynamic(() => import('@/components/GlobalSettingsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Settings...</p></div>
});
const PromptsHub = dynamic(() => import('@/components/PromptsHub'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><p>Loading Prompts Hub...</p></div>
});
const ShortcutsModal = dynamic(() => import('@/components/ShortcutsModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading Shortcuts...</p></div>
});
const AddKnowledgeModal = dynamic(() => import('@/components/AddKnowledgeModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p className="text-white">Loading...</p></div>
});
const CommandPalette = dynamic(() => import('@/components/CommandPalette'), {
    ssr: false,
});


export const App = () => {
    const { 
        createNewConversation, 
        clearMessages, 
        currentConversation, 
    } = useConversation();
    const {
        isConversationPanelOpen, 
        setConversationPanelOpen,
        isConversationPanelMinimized,
        setIsConversationPanelMinimized,
        isLogPanelOpen,
        setLogPanelOpen,
        changeFontSize,
        activeView,
        setActiveView,
        isContextMenuEnabled,
        isMobileView,
        isZenMode,
        isDataHubWidgetOpen,
        setDataHubWidgetOpen,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
    } = useUIState();

    const [isGlobalSettingsOpen, setGlobalSettingsOpen] = useState(false);
    const [isBookmarksOpen, setBookmarksOpen] = useState(false);
    const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false);
    const [isAddKnowledgeModalOpen, setAddKnowledgeModalOpen] = useState(false);
    
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        items: MenuItem[];
    }>({ isOpen: false, position: { x: 0, y: 0 }, items: [] });


    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        if (!isContextMenuEnabled) return;

        const selection = window.getSelection()?.toString() || '';
        const hasSelection = selection.length > 0;

        const menuItems: MenuItem[] = [
            { label: 'New Chat', icon: PlusIcon, action: createNewConversation, disabled: !createNewConversation },
            { isSeparator: true },
            { label: 'Clipboard', icon: ClipboardPasteIcon, children: [
                { label: 'Copy', icon: CopyIcon, action: () => document.execCommand('copy'), disabled: !hasSelection },
                { label: 'Cut', icon: ScissorsIcon, action: () => document.execCommand('cut'), disabled: !hasSelection },
                { label: 'Paste', icon: ClipboardPasteIcon, action: () => navigator.clipboard.readText().then(text => {
                    const target = event.target as HTMLElement;
                    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                        (target as HTMLInputElement | HTMLTextAreaElement).value += text;
                    }
                })},
            ]},
            { label: 'Conversation', icon: SidebarLeftIcon, children: [
                 { label: 'Clear Messages', icon: ClearIcon, action: () => currentConversation && clearMessages(currentConversation.id), disabled: !currentConversation },
                 { label: 'Delete Conversation', icon: TrashIcon, action: () => alert("Not implemented"), disabled: !currentConversation },
            ]},
             { label: 'View', icon: SettingsIcon, children: [
                { label: 'Toggle Conversations', icon: SidebarLeftIcon, action: () => setConversationPanelOpen(prev => !prev) },
                { label: 'Minimize Conversations', icon: MinusIcon, action: () => setIsConversationPanelMinimized(prev => !prev) },
                { label: 'Toggle Log Panel', icon: LogIcon, action: () => setLogPanelOpen(prev => !prev) },
                { label: 'Increase Font Size', icon: PlusIcon, action: () => changeFontSize('increase') },
                { label: 'Decrease Font Size', icon: MinusIcon, action: () => changeFontSize('decrease') },
            ]},
            { isSeparator: true },
            { label: 'Hubs', icon: DashboardIcon, children: [
                { label: 'Memory Center', icon: MemoryIcon, action: () => setActiveView('memory_center') },
                { label: 'Contacts Hub', icon: UsersIcon, action: () => setActiveView('contacts_hub') },
                { label: 'Prompts Hub', icon: PromptsIcon, action: () => setActiveView('prompts_hub') },
                { label: 'Tools Hub', icon: ToolsIcon, action: () => setActiveView('tools_hub') },
                { label: 'Tasks Hub', icon: TasksIcon, action: () => setActiveView('tasks_hub') },
                { label: 'Data Hub', icon: CircleStackIcon, action: () => setActiveView('data_hub') },
            ]},
            { label: 'Developer', icon: CodeIcon, children: [
                { label: 'Dashboard Center', icon: DashboardIcon, action: () => setActiveView('dashboard') },
                { label: 'Agent Center', icon: RocketLaunchIcon, action: () => setActiveView('agent_center') },
                { label: 'Brain Center', icon: BrainIcon, action: () => setActiveView('brain_center') },
                { label: 'Dev Center', icon: CodeIcon, action: () => setActiveView('dev_center') },
            ]},
            { isSeparator: true },
            { label: 'Add Knowledge Snippet', icon: KnowledgeIcon, action: () => setAddKnowledgeModalOpen(true) },
            { label: 'Keyboard Shortcuts', icon: KeyboardIcon, action: () => setShortcutsModalOpen(true) },
        ];
        
        setContextMenu({
            isOpen: true,
            position: { x: event.clientX, y: event.clientY },
            items: menuItems,
        });
    };

    useKeyboardShortcuts({
        'mod+n': createNewConversation,
        'mod+k': () => setCommandPaletteOpen(true),
        'mod+m': () => setActiveView('memory_center'),
    });

    const actions = getActionsRegistry({
        createNewConversation,
        setActiveView,
        setBookmarksOpen,
        setGlobalSettingsOpen,
        setLogPanelOpen,
    });
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardCenter />;
            case 'agent_center': return <AgentCenter />;
            case 'brain_center': return <BrainCenter />;
            case 'memory_center': return <MemoryCenter />;
            case 'contacts_hub': return <ContactsHub />;
            case 'prompts_hub': return <PromptsHub />;
            case 'tools_hub': return <ToolsHub />;
            case 'tasks_hub': return <TasksHub />;
            case 'dev_center': return <DevCenter />;
            case 'data_hub': return <DataHubCenter />;
            case 'chat':
            default:
                return <ChatWindow />;
        }
    };

    return (
        <div onContextMenu={handleContextMenu} className="font-sans h-full">
            <MorningBriefing />
            <UniversalProgressIndicator />
             <main className={`flex h-full w-full overflow-hidden bg-gray-900 text-gray-100 transition-all duration-300 ease-in-out ${isMobileView ? 'max-w-md mx-auto my-4 shadow-2xl rounded-2xl border-2 border-gray-700' : ''}`}>
                <AnimatePresence>
                    {!isZenMode && (
                        <NavigationRail 
                            setBookmarksOpen={setBookmarksOpen}
                            setGlobalSettingsOpen={setGlobalSettingsOpen}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {!isZenMode && isConversationPanelOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0, x: -50 }}
                            animate={{ width: isConversationPanelMinimized ? 80 : 320, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -50 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex-shrink-0"
                        >
                            <ConversationPanel isMinimized={isConversationPanelMinimized} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col min-w-0 bg-gray-900">
                    {renderActiveView()}
                     <AnimatePresence>
                        {!isZenMode && isLogPanelOpen && <LogOutputPanel isOpen={isLogPanelOpen} />}
                    </AnimatePresence>
                </div>

                {isGlobalSettingsOpen && <GlobalSettingsModal setIsOpen={setGlobalSettingsOpen} />}
                {isBookmarksOpen && <BookmarksModal isOpen={isBookmarksOpen} setIsOpen={setBookmarksOpen} />}
                {isShortcutsModalOpen && <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />}
                {isAddKnowledgeModalOpen && <AddKnowledgeModal isOpen={isAddKnowledgeModalOpen} onClose={() => setAddKnowledgeModalOpen(false)} />}
                {isDataHubWidgetOpen && <DataHubWidget isOpen={isDataHubWidgetOpen} onClose={() => setDataHubWidgetOpen(false)} />}
                
                <CommandPalette 
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setCommandPaletteOpen(false)}
                    actions={actions}
                />
                
                <ContextMenu
                    isOpen={contextMenu.isOpen}
                    position={contextMenu.position}
                    items={contextMenu.items}
                    onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                />
            </main>
        </div>
    );
};
