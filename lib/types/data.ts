// lib/types/data.ts

// Conversation & Messages
export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    userId?: string;
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    topP?: number;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    ui_settings?: {
        textAlign?: 'left' | 'right';
        model_for_response?: string;
    };
    summary?: string;
    enableMemoryExtraction?: boolean;
}

export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'model';
    content: string;
    content_summary?: string | null;
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

// Prompts & Workflows
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
    predicate: string; // e.g., 'is_part_of', 'works_at'
    context?: string;
    createdAt: Date;
}

// Features & Tests
export interface Feature {
    id: string;
    name: string;
    overview: string;
    status: FeatureStatus;
    ui_ux_breakdown_json: string | object | null;
    logic_flow: string;
    key_files_json: string | object | null;
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
    manual_steps: string;
    expected_result: string;
    last_run_status: TestStatus;
    last_run_at: Date | null;
    createdAt: Date;
}

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';

// Tools
export interface Tool {
    id: string;
    name: string;
    description: string;
    schema_json: object; // Gemini FunctionDeclaration schema
    createdAt: Date;
    lastUpdatedAt: Date;
}

// App Versioning
export interface VersionHistory {
    id: number;
    version: string;
    release_date: string;
    changes: string;
}

// Pipelines & Cognitive Inspector
export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    duration_ms: number | null;
    final_output: string | null;
    final_llm_prompt: object | null;
    final_system_instruction: string | null;
    model_config_json: object | null;
    createdAt: Date;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    input_payload: object | null;
    output_payload: object | null;
    duration_ms: number;
    status: 'completed' | 'failed';
    error_message: string | null;
    model_used?: string;
    config_used?: object;
    prompt_used?: string;
    createdAt: Date;
}

// Brains
export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// API Endpoints for Dev Center
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
    last_test_at: Date | null;
    last_test_status: ApiTestStatus;
    createdAt: Date;
}

export interface EndpointTestLog {
    id: string;
    endpoint_id: string;
    status: ApiTestStatus;
    status_code: number;
    response_body: Record<string, any> | null;
    response_headers: Record<string, any> | null;
    duration_ms: number;
    createdAt: Date;
}

// Documentation
export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

// Hedra Goals
export interface HedraGoal {
    section_key: string;
    content: string;
    lastUpdatedAt: Date;
}

// Segments
export interface Segment {
    id: string;
    name: string;
    type: 'Topic' | 'Impact';
    description?: string;
}

// Agents
export interface AgentRun {
    id: string;
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    result_summary: string | null;
    createdAt: Date;
    completedAt: Date | null;
}

export interface AgentPlanPhase {
    id: string;
    run_id: string;
    phase_order: number;
    goal: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result: string | null;
    steps: AgentRunStep[];
    started_at: Date | null;
    completed_at: Date | null;
}

export interface AgentRunStep {
    id: string;
    run_id: string;
    phase_id: string;
    step_order: number;
    thought: string;
    action: string; // Tool name
    action_input: object; // Arguments for the tool
    observation: string; // Result from the tool
    status: 'completed' | 'failed';
    createdAt: Date;
}

// Dashboard / Hedra
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
    orderIndex: number;
}

// Comm Hub
export interface CommChannel {
    id: string;
    name: string;
    type: 'webhook' | 'email_inbound' | 'app_broadcast';
    status: 'active' | 'inactive' | 'error';
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Tasks Hub
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'completed';
    due_date?: Date;
    completed_at?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Relationship Graph
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

// Nivo chart types
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

// Data Hub
export type DataSourceType = 
    | 'relational_db'
    | 'vector'
    | 'document_db'
    | 'graph'
    | 'key_value'
    | 'cache'
    | 'blob'
    | 'object_storage'
    | 'file_system';

export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'unstable' | 'needs_config' | 'full' | 'unsupported';

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

export {}; // Ensure this file is treated as a module
