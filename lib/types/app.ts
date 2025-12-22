
/**
 * @fileoverview This file contains application-level types, such as UI state and settings,
 * that are not direct representations of database models.
 */

export type CognitivePhase = 'idle' | 'retrieving' | 'assembling' | 'prompting' | 'generating';

export interface CognitiveStatus {
    phase: CognitivePhase;
    details: string;
}

export type ExecutionStatus = 'idle' | 'executing' | 'success' | 'error';

export interface ExecutionState {
    status: ExecutionStatus;
    data?: any;
    error?: string;
}

export interface ToolState extends ExecutionState {
    toolName?: string;
    input?: any;
    output?: any;
}

export interface MemoryMonitorState {
    semantic: ExecutionState;
    structured: ExecutionState;
    graph: ExecutionState;
    episodic: ExecutionState;
}

// A generic status object used throughout the app
export interface IStatus {
    currentAction: string | CognitiveStatus | null;
    error: string | null;
}

// Represents the state of an active workflow (chained prompt)
export interface ActiveWorkflowState {
    prompt: import('./data').Prompt;
    userInputs: Record<string, string>;
    currentStepIndex: number;
    stepOutputs: Record<number, string>;
}

export interface SavedFilterSet {
    id: string;
    name: string;
    filters: any; 
}


export interface AppSettings {
    defaultModelConfig: {
        model: string;
        temperature: number;
        topP: number;
    };
    defaultAgentConfig: {
        systemPrompt: string;
        useSemanticMemory: boolean;
        useStructuredMemory: boolean;
    };
    enableDebugLog: { enabled: boolean };
    featureFlags: {
        enableMemoryExtraction: boolean;
        enableProactiveSuggestions: boolean;
        enableAutoSummarization: boolean;
    };
    global_ui_settings?: {
        fontSize?: string;
        messageFontSize?: 'xs' | 'sm' | 'base' | 'lg';
        theme?: 'theme-dark' | 'theme-light' | 'theme-solarized';
    };
    entityGridSettings?: {
        showDescription: boolean;
        showAliases: boolean;
        showTags: boolean;
    };
    savedEntityHubFilters?: SavedFilterSet[];
    // Store custom prompts for the ChatInput toolbar
    customToolbarPrompts?: Record<string, string>; 
}

// For notification system
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ConversationContextType {
    activeRunId: string | null;
    startAgentRun: (goal: string) => Promise<void>;
    startWorkflow: (prompt: import('./data').Prompt, userInputs: Record<string, string>) => void;
}
