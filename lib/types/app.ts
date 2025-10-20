/**
 * @fileoverview This file contains application-level types, such as UI state and settings,
 * that are not direct representations of database models.
 */

export type CognitivePhase = 'idle' | 'retrieving' | 'assembling' | 'prompting' | 'generating';

export interface CognitiveStatus {
    phase: CognitivePhase;
    details: string;
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
    }
}

// For notification system
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ConversationContextType {
    // ... other properties
    activeRunId: string | null;
    startAgentRun: (goal: string) => Promise<void>;
    startWorkflow: (prompt: import('./data').Prompt, userInputs: Record<string, string>) => void;
}
