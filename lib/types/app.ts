import type { Prompt } from './data';

export type Role = 'user' | 'model';

export interface IStatus {
    currentAction?: string | object | null;
    error?: string | null;
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
    enableDebugLog: {
        enabled: boolean;
    };
    featureFlags: {
        enableMemoryExtraction: boolean;
        enableProactiveSuggestions: boolean;
        enableAutoSummarization: boolean;
    };
    global_ui_settings: {
        fontSize: string;
        messageFontSize: 'sm' | 'base' | 'lg' | 'xl';
    }
}

export interface Log {
    id: string;
    timestamp: Date;
    message: string;
    payload?: any;
    level: 'info' | 'warn' | 'error';
}

export interface ActiveWorkflowState {
    prompt: Prompt;
    userInputs: Record<string, string>;
    currentStepIndex: number;
    stepOutputs: Record<number, string>;
}
