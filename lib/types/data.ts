// @/lib/types/data.ts
import type { FunctionDeclaration } from "@google/genai";

// Base type for database records
export interface DbRecord {
    id: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

// Conversations & Messages
export interface Conversation extends DbRecord {
    title: string;
    summary?: string | null;
    model?: string | null;
    temperature?: number | null;
    topP?: number | null;
    systemPrompt?: string | null;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    enableMemoryExtraction?: boolean; // From feature flags
    ui_settings?: {
        textAlign?: 'left' | 'right';
        model_for_response?: string;
    } | null;
}

export interface Message extends DbRecord {
    conversationId: string;
    role: 'user' | 'model';
    content: string;
    content_summary?: string | null;
    tokenCount?: number | null;
    responseTime?: number | null;
    isBookmarked?: boolean;
    parentMessageId?: string | null;
    tags?: string[] | null;
    threadMessages?: Message[];
}

// Contacts
export interface Contact extends DbRecord {
    name: string;
    email?: string | null;
    company?: string | null;
    phone?: string | null;
    notes?: string | null;
    tags?: string[] | null;
}

// Memory System: Entities, Relationships, Segments
export interface EntityDefinition extends DbRecord {
    name: string;
    type: string;
    description?: string | null;
    aliases?: string[] | any; // JSON can be weird
}

export interface EntityRelationship extends DbRecord {
    source_entity_id: string;
    target_entity_id: string;
    predicate: string;
    context?: string | null;
}

export interface Segment extends DbRecord {
    id: string;
    name: string;
    type: 'Topic' | 'Impact';
    description: string | null;
    createdAt: Date;
    lastUpdatedAt: Date;
}


// Graph Visualization
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
    context?: string | null;
}
export interface RelationshipGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

// Prompts & Workflows
export interface PromptChainStep {
    step: number;
    type: 'prompt' | 'tool';
    promptId: string | null;
    toolId: string | null;
    inputMapping: Record<string, {
        source: 'userInput' | 'stepOutput';
        step?: number;
    }>;
}

export interface Prompt extends DbRecord {
    name: string;
    content: string;
    folder?: string | null;
    tags?: string[] | null;
    type: 'single' | 'chain';
    chain_definition?: PromptChainStep[] | null;
}

// Tools
export interface Tool extends DbRecord {
    name: string;
    description: string;
    schema_json: FunctionDeclaration | any;
}

// Pipelines
export interface PipelineRun extends DbRecord {
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    duration_ms?: number | null;
    final_output?: string | null;
    final_llm_prompt?: string | null;
    final_system_instruction?: string | null;
    model_config_json?: Record<string, any> | null;
}

export interface PipelineRunStep extends DbRecord {
    run_id: string;
    step_order: number;
    step_name: string;
    input_payload: Record<string, any> | null;
    output_payload: Record<string, any> | null;
    duration_ms: number;
    status: 'completed' | 'failed';
    error_message?: string | null;
    model_used?: string | null;
    prompt_used?: string | null;
    config_used?: Record<string, any> | null;
}

// Developer & QA
export type FeatureStatus = '✅ Completed' | '🟡 Needs Improvement' | '🔴 Needs Refactor' | '⚪ Planned';

export interface UiUxSubFeature {
    subFeature: string;
    description: string;
    status: FeatureStatus;
}

export interface Feature extends DbRecord {
    name: string;
    overview: string;
    status: FeatureStatus;
    ui_ux_breakdown_json: string | UiUxSubFeature[];
    logic_flow: string;
    key_files_json: string | string[];
    notes?: string | null;
}

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface FeatureTest extends DbRecord {
    featureId: string;
    description: string;
    manual_steps: string;
    expected_result: string;
    last_run_status: TestStatus;
    last_run_at: Date | null;
}

// API Command Center
export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface ApiEndpoint extends DbRecord {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    group_name: string;
    description: string | null;
    default_params_json: Record<string, any> | null;
    default_body_json: Record<string, any> | null;
    expected_status_code: number;
    last_test_at: Date | null;
    last_test_status: ApiTestStatus;
}

export interface EndpointTestLog extends DbRecord {
    endpoint_id: string;
    status: ApiTestStatus;
    status_code: number;
    response_body: Record<string, any> | null;
    response_headers: Record<string, any> | null;
    duration_ms: number;
}


// App Versioning
export interface VersionHistory extends DbRecord {
    version: string;
    release_date: Date;
    changes: string;
}

// Brains
export interface Brain extends DbRecord {
    name: string;
    config_json: Record<string, any>;
}

// Dashboard
export interface HedraGoal extends DbRecord {
    section_key: 'main_goal' | 'ideas' | 'status';
    content: string;
}

export interface Documentation extends DbRecord {
    doc_key: string;
    title: string;
    content: string;
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
    tasks: {
        completed: string[];
        remaining: string[];
    };
    orderIndex: number;
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

// Agent Center
export interface AgentRun extends DbRecord {
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    result_summary?: string | null;
    completedAt?: Date | null;
}

export interface AgentPlanPhase extends DbRecord {
    run_id: string;
    phase_order: number;
    goal: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string | null;
    started_at?: Date | null;
    completed_at?: Date | null;
    steps: AgentRunStep[];
}

export interface AgentRunStep extends DbRecord {
    run_id: string;
    phase_id: string;
    step_order: number;
    thought: string;
    action: string;
    action_input: Record<string, any>;
    observation: string;
    status: 'running' | 'completed';
}

export interface Experience extends DbRecord {
    source_run_id: string | null;
    goal_template: string;
    trigger_keywords: string[] | null;
    steps_json: Record<string, any> | null;
    confidence_score: number;
    usage_count: number;
}

// Tasks
export interface Task extends DbRecord {
    title: string;
    description?: string | null;
    due_date?: Date | null;
    status: 'todo' | 'in_progress' | 'completed';
    completed_at?: Date | null;
}

// Data Hub
export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unstable' | 'unsupported';
export type DataSourceType = 'relational_db' | 'vector' | 'blob' | 'cache' | 'document_db' | 'file_system' | 'graph' | 'key_value' | 'object_storage';

export interface DataSource extends DbRecord {
    name: string;
    provider: string;
    type: DataSourceType;
    status: DataSourceStatus;
    config_json: Record<string, any>;
    stats_json: { label: string; value: string | number }[];
}

// Communications Hub
export interface CommChannel extends DbRecord {
    name: string;
    type: 'webhook' | 'email_inbound' | 'app_broadcast';
    status: 'active' | 'inactive' | 'error';
    config_json: Record<string, any>;
}