
/**
 * @fileoverview Application-level types for cognitive state and AI usage metrics.
 */

export type CognitivePhase = 'idle' | 'retrieving' | 'assembling' | 'prompting' | 'generating' | 'reasoning' | 'acting';

export interface CognitiveStatus {
    phase: CognitivePhase;
    details: string;
}

export type ExecutionStatus = 'idle' | 'executing' | 'success' | 'null' | 'error';

export interface UsageMetric {
    origin: 'retrieval' | 'generation' | 'agent_thought' | 'link_prediction' | 'synthesis';
    model: string;
    timestamp: string;
}

export interface ExecutionState {
    status: ExecutionStatus;
    query?: string;
    data?: any;
    error?: string;
    usage?: UsageMetric[];
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

export interface IStatus {
    currentAction: string | CognitiveStatus | null;
    error: string | null;
    aiCallCount: number;
    callLog: UsageMetric[];
}

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
        enableReActAgent: boolean;
        enableLinkPrediction: boolean;
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
    customToolbarPrompts?: Record<string, string>; 
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ConversationContextType {
    activeRunId: string | null;
    startAgentRun: (goal: string) => Promise<void>;
    startWorkflow: (prompt: import('./data').Prompt, userInputs: Record<string, string>) => void;
}
