// Conversation & Messages
export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    userId?: string;
    summary?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    enableMemoryExtraction?: boolean;
    ui_settings?: {
        textAlign?: 'left' | 'right';
        messageFontSize?: 'sm' | 'base' | 'lg' | 'xl';
        model_for_response?: string;
    };
}

export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'model';
    content: string;
    content_summary?: string;
    createdAt: Date;
    tokenCount?: number;
    responseTime?: number;
    isBookmarked?: boolean;
    parentMessageId?: string | null;
    tags?: string[];
    threadMessages?: Message[];
}

// Contacts
export interface Contact {
    id: string;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    notes?: string;
    tags?: string[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Entities & Relationships
export interface EntityDefinition {
    id: string;
    name: string;
    type: string;
    description?: string;
    aliases?: string[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface EntityRelationship {
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    predicate: string;
    context?: string;
    createdAt: Date;
}

export interface GraphNode {
    id: string;
    name: string;
    type: string;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    context?: string;
}

export interface RelationshipGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}


// Prompts & Tools
export interface Prompt {
    id: string;
    name: string;
    content: string;
    folder?: string;
    tags?: string[];
    type: 'single' | 'chain';
    chain_definition?: PromptChainStep[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface PromptChainStep {
    step: number;
    type: 'prompt' | 'tool';
    promptId: string | null;
    toolId: string | null;
    inputMapping: Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    schema_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Agent Execution
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
    result?: string;
    started_at?: Date;
    completed_at?: Date;
    steps?: AgentRunStep[];
}

export interface AgentRunStep {
    id: string;
    run_id: string;
    phase_id: string | null;
    step_order: number;
    thought: string;
    action_type: string;
    action_input?: any;
    observation?: string;
    createdAt: Date;
}

// Development & Project Management
export interface Feature {
    id: string;
    name: string;
    overview: string;
    status: FeatureStatus;
    ui_ux_breakdown_json: UiUxSubFeature[] | string;
    logic_flow: string;
    key_files_json: string[] | string;
    notes: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export type FeatureStatus = '✅ Completed' | '🟡 Needs Improvement' | '🔴 Needs Refactor' | '⚪ Planned';

export interface UiUxSubFeature {
    subFeature: string;
    description: string;
    status: FeatureStatus;
}

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

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    group_name: string;
    description?: string;
    default_params_json?: Record<string, any>;
    default_body_json?: Record<string, any>;
    expected_status_code: number;
    last_test_status: ApiTestStatus;
    last_test_at?: Date;
    createdAt: Date;
}

export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';

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

// Versioning
export interface VersionHistory {
    id: string;
    version: string;
    release_date: Date;
    changes: string;
}

// Pipeline & Inspection
export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    duration_ms?: number;
    final_output?: string;
    final_llm_prompt?: string;
    final_system_instruction?: string;
    model_config_json?: Record<string, any>;
    createdAt: Date;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    input_payload: any;
    output_payload: any;
    duration_ms: number;
    status: 'completed' | 'failed';
    model_used?: string;
    config_used?: Record<string, any>;
    prompt_used?: string;
    error_message?: string;
    createdAt: Date;
}

// Dashboard & Subsystems
export interface Subsystem {
    id: string;
    name: string;
    description: string;
    progress: number;
    healthScore: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    dependencies: string[];
    resources: { name: string, url: string }[];
    milestones: { description: string, completed: boolean }[];
    githubStats: {
        commits: number;
        pullRequests: number;
        issues: number;
        repoUrl: string;
    };
    tasks?: {
        completed: string[];
        remaining: string[];
    }
}

export interface HedraGoal {
    section_key: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

// Tasks
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'completed';
    due_date?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
    completed_at?: Date;
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
    stats_json: { label: string; value: string | number }[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Brains & Comm Channels
export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface CommChannel {
    id: string;
    name: string;
    type: 'webhook' | 'app_broadcast' | 'email_inbound';
    status: 'active' | 'inactive' | 'error';
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Chart Data
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

// Segments for conversation categorization
export interface Segment {
    id: string;
    name: string;
    type: 'Topic' | 'Impact';
    description?: string;
}
