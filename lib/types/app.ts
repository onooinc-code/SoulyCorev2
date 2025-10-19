// FIX: Added import for Prompt to be used in ActiveWorkflowState.
import type { Prompt } from './data';

export type Role = 'user' | 'model';

export type CognitivePhase = 'idle' | 'retrieving' | 'assembling' | 'prompting' | 'generating';

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
    enableDebugLog: {
        enabled: boolean;
    };
    featureFlags: {
        enableMemoryExtraction: boolean;
        enableProactiveSuggestions: boolean;
        enableAutoSummarization: boolean;
    };
    global_ui_settings?: {
        fontSize?: string;
        messageFontSize?: 'sm' | 'base' | 'lg' | 'xl';
        theme?: 'theme-dark' | 'theme-light' | 'theme-solarized';
    };
}

export interface Log {
    id: string;
    timestamp: Date;
    message: string;
    payload: Record<string, any> | null;
    level: 'info' | 'warn' | 'error';
}

export interface IStatus {
  currentAction: string | { phase: CognitivePhase; details: string };
  error: string | null;
}

// FIX: Moved ActiveWorkflowState here from ConversationProvider to resolve export error.
export interface ActiveWorkflowState {
  prompt: Prompt;
  userInputs: Record<string, string>;
  currentStepIndex: number;
  stepOutputs: Record<number, string>;
}