
export type Role = 'user' | 'model';

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
}

export interface Log {
    id: string;
    timestamp: Date;
    message: string;
    payload: Record<string, any> | null;
    level: 'info' | 'warn' | 'error';
}

export interface IStatus {
  currentAction: string;
  error: string | null;
}
