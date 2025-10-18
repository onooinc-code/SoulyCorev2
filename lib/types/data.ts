// From conversations table
export interface Conversation {
    id: string;
    agentId: string;
    title: string;
    summary?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    systemPrompt?: string;
    useSemanticMemory: boolean;
    useStructuredMemory: boolean;
    model?: string;
    temperature?: number;
    topP?: number;
    enableMemoryExtraction: boolean;
    enableProactiveSuggestions: boolean;
    enableAutoSummarization: boolean;
    ui_settings?: {
        model_for_response?: string;
        model_for_context?: string;
        model_for_memory?: string;
        [key: string]: any;
    };
}

// From messages table
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
}

// From contacts table
export interface Contact {
    id: string;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    linkedin_url?: string;
    address?: string;
    tags?: string[];
    notes?: string;
    last_contacted_date?: Date;
    details_json?: any;
    createdAt: Date;
}

// From entities table
export interface Entity {
    id: string;
    name: string;
    type: string;
    details_json: string; // It's a string in the DB
    createdAt: Date;
}

// From prompts table
export interface Prompt {
    id: string;
    name: string;
    content: string;
    folder?: string;
    tags?: string[];
    createdAt: Date;
    lastUpdatedAt: Date;
    type: 'single' | 'chain';
    chain_definition?: PromptChainStep[];
}

export interface PromptChainStep {
    step: number;
    type: 'prompt' | 'tool';
    promptId: string | null;
    toolId: string | null;
    inputMapping: Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>;
}

// From tools table
export interface Tool {
    id: string;
    name: string;
    description?: string;
    schema_json: any;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// From features table
export type FeatureStatus = '✅ Completed' | '🟡 Needs Improvement' | '🔴 Needs Refactor' | '⚪ Planned';
export interface UiUxSubFeature {
    subFeature: string;
    description: string;
    status: FeatureStatus;
}
export interface Feature {
    id: string;
    name: string;
    overview?: string;
    status: FeatureStatus;
    ui_ux_breakdown_json?: UiUxSubFeature[] | string;
    logic_flow?: string;
    key_files_json?: string[] | string;
    notes?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// From feature_tests table
export type TestStatus = 'Passed' | 'Failed' | 'Not Run';
export interface FeatureTest {
    id: string;
    featureId: string;
    description: string;
    manual_steps?: string;
    expected_result: string;
    last_run_status: TestStatus;
    last_run_at?: Date;
    createdAt: Date;
}

// From api_endpoints table
export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';
export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    group_name: string;
    description?: string;
    default_params_json?: any;
    default_body_json?: any;
    expected_status_code: number;
    last_test_status: ApiTestStatus;
    last_test_at?: Date;
    createdAt: Date;
}

// From endpoint_test_logs table
export interface EndpointTestLog {
    id: string;
    endpoint_id: string;
    status: ApiTestStatus;
    status_code: number;
    response_body: any;
    response_headers: any;
    duration_ms: number;
    createdAt: Date;
}

// From brains table
export interface Brain {
    id: string;
    name: string;
    config_json: any;
    createdAt: Date;
}

// From subsystems table
export interface Milestone {
    description: string;
    completed: boolean;
}
export interface Resource {
    name: string;
    url: string;
}
export interface GithubStats {
    commits: number;
    pullRequests: number;
    issues: number;
    repoUrl: string;
}
export interface Subsystem {
    id: string;
    name: string;
    description?: string;
    progress: number;
    healthScore: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    dependencies: string[];
    resources: Resource[];
    milestones: Milestone[];
    githubStats: GithubStats;
    tasks?: {
        completed: string[];
        remaining: string[];
    };
    orderIndex: number;
}

// From version_history table
export interface VersionHistory {
    id: string;
    version: string;
    release_date: Date;
    changes: string;
    createdAt: Date;
}

// From documentations table
export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content?: string;
    lastUpdatedAt: Date;
}

// From hedra_goals table
export interface HedraGoal {
    id: string;
    section_key: string;
    content?: string;
    lastUpdatedAt: Date;
}

// From tasks table
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in-progress' | 'completed';
    due_date?: Date;
    completed_at?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// From data_sources table
export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unstable' | 'unsupported';
export type DataSourceType = 'relational_db' | 'vector' | 'blob' | 'cache' | 'document_db' | 'file_system' | 'graph' | 'key_value' | 'object_storage';
export interface DataSource {
    id: string;
    name: string;
    provider: string;
    type: DataSourceType;
    status: DataSourceStatus;
    config_json?: any;
    stats?: { label: string; value: string | number }[];
    last_successful_connection?: Date;
    last_error?: string;
    is_enabled: boolean;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// For charts
export interface FeatureStatusChartData {
    id: string;
    label: string;
    value: number;
    color: string;
}

export interface PipelinePerformanceChartData {
    pipeline: string;
    Completed: number;
    Failed: number;
    'Avg Duration (ms)': number;
}


// From agent run tables
export interface AgentRun {
    id: string;
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    final_result?: string;
    createdAt: Date;
    completedAt?: Date;
    duration_ms?: number;
}

// From pipeline run tables
export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    final_output: string;
    error_message?: string;
    start_time: Date;
    end_time?: Date;
    duration_ms?: number;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    status: 'completed' | 'failed';
    input_payload?: any;
    output_payload?: any;
    model_used?: string;
    prompt_used?: string;
    config_used?: any;
    error_message?: string;
    start_time: Date;
    end_time?: Date;
    duration_ms?: number;
}


export interface AgentPlanPhase {
    id: string;
    run_id: string;
    phase_order: number;
    goal: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    started_at?: Date;
    completed_at?: Date;
    steps?: AgentRunStep[];
}

export interface AgentRunStep {
    id: string;
    run_id: string;
    phase_id?: string;
    step_order: number;
    thought?: string;
    action_type: 'tool' | 'finish';
    action_input?: any;
    observation?: string;
    createdAt: Date;
}
