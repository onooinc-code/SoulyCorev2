// lib/types/data.ts

/**
 * @fileoverview This file contains all the data model types for the application.
 * It is based on the database schema defined in `scripts/create-tables.js`.
 */

export interface Conversation {
    id: string;
    title: string;
    summary?: string;
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    topP?: number;
    ui_settings?: Record<string, any>;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    enableMemoryExtraction?: boolean;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'model';
    content: string;
    tokenCount?: number;
    responseTime?: number;
    isBookmarked?: boolean;
    parentMessageId?: string | null;
    tags?: string[];
    content_summary?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    threadMessages?: Message[];
}

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
    predicate: string; // e.g., 'is_related_to', 'works_at'
    context?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Segment {
    id: string;
    name: string;
    type: 'Topic' | 'Impact';
    description?: string;
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

export interface Tool {
    id: string;
    name: string;
    description: string;
    schema_json: any; // Gemini FunctionDeclaration schema
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface AgentRun {
    id: string;
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    result_summary?: string;
    createdAt: Date;
    completedAt?: Date;
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
}

export interface AgentRunStep {
    id: string;
    run_id: string;
    phase_id: string;
    step_order: number;
    thought: string;
    action: string;
    action_input: Record<string, any>;
    observation: string;
    status: 'running' | 'completed' | 'failed';
    started_at: Date;
    completed_at?: Date;
}

export type DataSourceType = 'relational_db' | 'vector' | 'blob' | 'cache' | 'document_db' | 'file_system' | 'graph' | 'key_value' | 'object_storage';
export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unstable' | 'unsupported';

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
    createdAt: Date;
}

export interface EndpointTestLog {
    id: string;
    endpoint_id: string;
    status: 'Passed' | 'Failed';
    status_code: number;
    response_body: Record<string, any>;
    response_headers: Record<string, any>;
    duration_ms: number;
    createdAt: Date;
}

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
    ui_ux_breakdown_json: UiUxSubFeature[] | string;
    logic_flow: string;
    key_files_json: string[] | string;
    notes?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

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

export interface Subsystem {
    id: string;
    name: string;
    description: string;
    progress: number;
    healthScore: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    dependencies: string[];
    resources: { name: string; url: string }[];
    milestones: { description: string; completed: boolean }[];
    githubStats: { commits: number; pullRequests: number; issues: number; repoUrl: string };
    tasks?: { completed: string[]; remaining: string[] };
    orderIndex?: number;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
    due_date?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface ProjectTask {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    order_index: number;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    due_date?: Date;
    status: 'todo' | 'in_progress' | 'completed';
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Experience {
    id: string;
    source_run_id: string;
    goal_template: string;
    trigger_keywords: string[];
    steps_json: Record<string, any>;
    usage_count: number;
    last_used_at?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface CommChannel {
    id: string;
    name: string;
    type: 'webhook' | 'email_inbound' | 'app_broadcast';
    status: 'active' | 'inactive' | 'error';
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    duration_ms: number;
    final_output: string;
    final_llm_prompt: string;
    final_system_instruction: string;
    model_config_json: Record<string, any>;
    createdAt: Date;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    input_payload: Record<string, any>;
    output_payload?: Record<string, any>;
    duration_ms: number;
    status: 'completed' | 'failed';
    error_message?: string;
    model_used?: string;
    prompt_used?: string;
    config_used?: Record<string, any>;
    timestamp: Date;
}

export interface VersionHistory {
    id: string;
    version: string;
    release_date: Date;
    changes: string;
    createdAt: Date;
}

export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface HedraGoal {
    section_key: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface Log {
    id: string;
    timestamp: Date;
    message: string;
    payload?: Record<string, any>;
    level: 'info' | 'warn' | 'error';
}

export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}


// For Nivo charts
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
}

// For relationship graph
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

// Make sure this file is treated as a module
export {};
