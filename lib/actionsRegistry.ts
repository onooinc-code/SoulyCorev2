// lib/actionsRegistry.ts
// This is a placeholder for a more dynamic action registry.
// In a real app, this might be auto-generated or built from multiple sources.

// FIX: Added React import to resolve namespace error for React.FC.
import React from 'react';
import {
    PlusIcon, MemoryIcon, UsersIcon, CodeIcon, BookmarkListIcon,
    SettingsIcon, LogIcon, BrainIcon, DashboardIcon, PromptsIcon,
    ChatBubbleLeftRightIcon,
    RocketLaunchIcon,
    ToolsIcon,
    ClipboardDocumentListIcon,
    CircleStackIcon,
    SearchIcon,
    PowerIcon,
    RefreshIcon,
    TrashIcon,
    KnowledgeIcon,
    KeyboardIcon,
    ScissorsIcon,
    DocumentMagnifyingGlassIcon,
} from '@/components/Icons';

export interface Action {
    id: string;
    name: string;
    subtitle?: string;
    icon: React.FC<any>;
    section: 'Navigation' | 'Conversation' | 'Application' | 'Data';
    // The handler would be defined in a place that has access to the necessary context setters
    // For now, we'll use an identifier that the CommandPalette can map to a function.
    handlerId: string;
}

export const actions: Action[] = [
    // Navigation
    { id: 'nav-dashboard', name: 'Go to Dashboard', icon: DashboardIcon, section: 'Navigation', handlerId: 'setActiveView-dashboard' },
    { id: 'nav-search', name: 'Go to Global Search', icon: SearchIcon, section: 'Navigation', handlerId: 'setActiveView-search' },
    { id: 'nav-agent-center', name: 'Go to Agent Center', icon: RocketLaunchIcon, section: 'Navigation', handlerId: 'setActiveView-agent_center' },
    { id: 'nav-brain-center', name: 'Go to Brain Center', icon: BrainIcon, section: 'Navigation', handlerId: 'setActiveView-brain_center' },
    { id: 'nav-memory-extraction-hub', name: 'Go to Memory Extraction', icon: ScissorsIcon, section: 'Navigation', handlerId: 'setActiveView-memory_extraction_hub' },
    { id: 'nav-contextual-analyzer', name: 'Go to Contextual Analyzer', icon: DocumentMagnifyingGlassIcon, section: 'Navigation', handlerId: 'setActiveView-contextual_analyzer' },
    { id: 'nav-memory-center', name: 'Go to Memory Center', icon: MemoryIcon, section: 'Navigation', handlerId: 'setActiveView-memory_center' },
    { id: 'nav-contacts-hub', name: 'Go to Contacts Hub', icon: UsersIcon, section: 'Navigation', handlerId: 'setActiveView-contacts_hub' },
    { id: 'nav-prompts-hub', name: 'Go to Prompts Hub', icon: PromptsIcon, section: 'Navigation', handlerId: 'setActiveView-prompts_hub' },
    { id: 'nav-tools-hub', name: 'Go to Tools Hub', icon: ToolsIcon, section: 'Navigation', handlerId: 'setActiveView-tools_hub' },
    { id: 'nav-projects-hub', name: 'Go to Projects Hub', icon: ClipboardDocumentListIcon, section: 'Navigation', handlerId: 'setActiveView-projects_hub' },
    { id: 'nav-data-hub', name: 'Go to Data Hub', icon: CircleStackIcon, section: 'Navigation', handlerId: 'setActiveView-data_hub' },
    { id: 'nav-dev-center', name: 'Go to Dev Center', icon: CodeIcon, section: 'Navigation', handlerId: 'setActiveView-dev_center' },
    
    // Conversation
    { id: 'convo-new', name: 'New Conversation', subtitle: 'Start a new chat', icon: PlusIcon, section: 'Conversation', handlerId: 'createNewConversation' },
    { id: 'convo-list', name: 'Toggle Conversation List', icon: ChatBubbleLeftRightIcon, section: 'Conversation', handlerId: 'toggleConversationPanel' },
    { id: 'convo-clear', name: 'Clear Messages', subtitle: 'Deletes all messages in the current chat', icon: TrashIcon, section: 'Conversation', handlerId: 'clearCurrentConversation' },
    
    // Data
    { id: 'data-add-knowledge', name: 'Add Knowledge Snippet', subtitle: 'Add a fact to semantic memory', icon: KnowledgeIcon, section: 'Data', handlerId: 'openAddKnowledge' },
    { id: 'data-bookmarks', name: 'View Bookmarks', icon: BookmarkListIcon, section: 'Data', handlerId: 'openBookmarks' },

    // Application
    { id: 'app-command-palette', name: 'Open Command Palette', subtitle: 'You are here!', icon: SearchIcon, section: 'Application', handlerId: 'openCommandPalette' },
    { id: 'app-settings', name: 'Open Global Settings', icon: SettingsIcon, section: 'Application', handlerId: 'openGlobalSettings' },
    { id: 'app-shortcuts', name: 'View Keyboard Shortcuts', icon: KeyboardIcon, section: 'Application', handlerId: 'openShortcuts' },
    { id: 'app-log', name: 'Toggle Log Panel', icon: LogIcon, section: 'Application', handlerId: 'toggleLogPanel' },
    { id: 'app-last-report', name: 'View Last AI Report', icon: CodeIcon, section: 'Application', handlerId: 'openResponseViewer' },
    { id: 'app-restart', name: 'Hard Reset App', icon: RefreshIcon, section: 'Application', handlerId: 'restartApp' },
    { id: 'app-exit', name: 'Exit App', icon: PowerIcon, section: 'Application', handlerId: 'exitApp' },
];