// lib/types/data.ts

// Conversation & Messaging
export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    systemPrompt?: string;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    model?: string;
    temperature?: number;
    topP?: number;
    ui_settings?: {
        textAlign?: 'left' | 'right';
        model_for_response?: string;
    };
    enableProactiveSuggestions?: boolean;
    enableAutoSummarization?: boolean;
    // FIX: Add missing property to Conversation type.
    enableMemoryExtraction?: boolean;
}

export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'model';
    content: string;
    createdAt: Date;
    tokenCount?: number;
    responseTime?: number;
    isBookmarked?: boolean;
    parentMessageId?: string | null;
    tags?: string[];
    threadMessages?: Message[];
}

// Memory & Knowledge
export interface Contact {
    id: string;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    notes?: string;
    tags?: string[];
}

export interface Entity {
    id: string;
    name: string;
    type: string;
    details_json: string;
    createdAt: Date;
}

export interface PromptChainStep {
    step: number;
    type: 'prompt' | 'tool';
    promptId: string | null;
    toolId: string | null;
    inputMapping: Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>;
}

export interface Prompt {
    id: string;
    name: string;
    content: string;
    folder?: string;
    tags?: string[];
    type: 'single' | 'chain';
    chain_definition?: PromptChainStep[];
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    schema_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Project & Feature Management
export type FeatureStatus = '✅ Completed' | '🟡 Needs Improvement' | '🔴 Needs Refactor' | '⚪ Planned';

export interface UiUxSubFeature {
    subFeature: string;
    description: string;
    status: FeatureStatus;
}

export interface Feature {
    id: string;
    name: string;
    overview: string;
    status: FeatureStatus;
    ui_ux_breakdown_json: string | UiUxSubFeature[];
    logic_flow: string;
    key_files_json: string | string[];
    notes?: string;
}

export interface VersionHistory {
    id: string;
    version: string;
    release_date: string;
    changes: string;
}

// Cognitive Engine & Pipelines
export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
}

export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    final_output: string;
    final_llm_prompt?: string;
    final_system_instruction?: string;
    model_config_json?: Record<string, any>;
    duration_ms?: number;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    status: 'completed' | 'failed';
    input_payload?: Record<string, any>;
    output_payload?: Record<string, any>;
    model_used?: string;
    config_used?: Record<string, any>;
    prompt_used?: string;
    error_message?: string;
    duration_ms?: number;
}

// API & Testing
export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    group_name: string;
    description?: string;
    default_params_json?: Record<string, any>;
    default_body_json?: Record<string, any>;
    expected_status_code: number;
    last_test_at?: Date;
    last_test_status: ApiTestStatus;
}

export interface EndpointTestLog {
    id: string;
    endpoint_id: string;
    status: ApiTestStatus;
    status_code: number;
    response_body?: Record<string, any>;
    response_headers?: Record<string, any>;
    duration_ms: number;
    createdAt: Date;
}

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface FeatureTest {
    id: string;
    featureId: string;
    description: string;
    manual_steps?: string;
    expected_result: string;
    last_run_at?: Date;
    last_run_status: TestStatus;
    createdAt: Date;
}

// Dashboard & Hedra
export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface HedraGoal {
    id: string;
    section_key: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface Subsystem {
    id: string;
    name: string;
    description: string;
    progress: number;
    healthScore: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    dependencies: string[];
    resources: { name: string; url: string }[];
    milestones: { description: string; completed: boolean }[];
    githubStats: {
        commits: number;
        pullRequests: number;
        issues: number;
        repoUrl: string;
    };
    tasks?: {
        completed: string[];
        remaining: string[];
    };
    orderIndex?: number;
}

export type FeatureStatusChartData = {
    id: string;
    label: string;
    value: number;
    color: string;
};

export type PipelinePerformanceChartData = {
    pipeline: string;
    Completed: number;
    Failed: number;
    'Avg Duration (ms)': number;
};

// Agents
export interface AgentRun {
    id: string;
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    final_result?: string;
    createdAt: Date;
    completedAt?: Date;
    duration_ms?: number;
}

export interface AgentPlanPhase {
    id: string;
    run_id: string;
    phase_order: number;
    goal: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    steps?: AgentRunStep[];
    result?: string;
    started_at?: Date;
    completed_at?: Date;
}

export interface AgentRunStep {
    id: string;
    run_id: string;
    phase_id: string;
    step_order: number;
    thought?: string;
    action_type: 'tool' | 'finish';
    action_input?: Record<string, any>;
    observation?: string;
}

// Communication Hub
export interface CommChannel {
    id: string;
    name: string;
    type: 'webhook' | 'email_inbound' | 'app_broadcast';
    status: 'active' | 'inactive' | 'error';
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Data Hub
export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unstable' | 'unsupported';
export type DataSourceType = 'relational_db' | 'vector' | 'blob' | 'cache' | 'document_db' | 'file_system' | 'graph' | 'key_value' | 'object_storage';

export interface DataSource {
    id: string;
    name: string;
    provider: string;
    type: DataSourceType;
    status: DataSourceStatus;
    config_json: Record<string, any>;
    stats_json: { label: string, value: string | number }[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Tasks Hub
export interface Task {
    id: string;
    title: string;
    description?: string;
    due_date?: Date;
    status: 'todo' | 'in_progress' | 'completed';
    completed_at?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}