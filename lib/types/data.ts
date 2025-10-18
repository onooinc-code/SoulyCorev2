import { Role } from './app';

export interface Conversation {
    id: string;
    agentId: string;
    title: string;
    summary: string | null;
    createdAt: Date;
    lastUpdatedAt: Date;
    systemPrompt?: string;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    model?: string;
    temperature?: number;
    topP?: number;
    enableMemoryExtraction?: boolean;
    enableProactiveSuggestions?: boolean;
    enableAutoSummarization?: boolean;
    ui_settings?: {
        textAlign?: 'left' | 'right' | 'center';
        model_for_response?: string;
        model_for_context?: string;
        model_for_memory?: string;
        [key: string]: any;
    } | null;
}

export interface Message {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    createdAt: Date;
    tokenCount?: number;
    responseTime?: number | null;
    isBookmarked?: boolean;
    parentMessageId?: string | null;
    threadMessages?: Message[]; // For nesting replies
    tags?: string[] | null;
}

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
    details_json?: Record<string, any>;
    createdAt: Date;
}

export interface Entity {
    id: string;
    name: string;
    type: string;
    details_json: string;
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
    ui_ux_breakdown_json: string; // Stored as a JSON string
    logic_flow: string;
    key_files_json: string; // Stored as a JSON string
    notes: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Tool {
    id:string;
    name: string;
    description: string;
    schema_json: string; // This is a stringified JSON object.
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface PromptChainStep {
    step: number;
    type: 'prompt' | 'tool';
    promptId?: string | null;
    toolId?: string | null;
    inputMapping: Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>;
}

export interface Prompt {
    id: string;
    name: string;
    content: string;
    folder?: string | null;
    tags?: string[] | null;
    createdAt: Date;
    lastUpdatedAt: Date;
    type: 'single' | 'chain';
    chain_definition?: PromptChainStep[] | null;
}

export interface Knowledge {
    id: string;
    content: string;
    embedding: number[];
    source: string;
}

export interface Cache {
    key: string;
    value: string;
    expiresAt: Date;
}

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface FeatureTest {
    id: string;
    featureId: string;
    description: string;
    manual_steps: string | null;
    expected_result: string;
    last_run_status: TestStatus;
    last_run_at: Date | null;
    createdAt: Date;
}

export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
}

export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    group_name: string;
    description: string | null;
    default_params_json: Record<string, any> | null;
    default_body_json: Record<string, any> | null;
    expected_status_code: number;
    last_test_status: ApiTestStatus;
    last_test_at: Date | null;
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

export interface PipelineRun {
    id: string;
    message_id: string;
    pipeline_type: 'ContextAssembly' | 'MemoryExtraction' | 'N/A';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    final_output: string | null;
    error_message: string | null;
    start_time: Date;
    end_time: Date | null;
    duration_ms: number | null;
}

export interface PipelineRunStep {
    id: string;
    run_id: string;
    step_order: number;
    step_name: string;
    status: 'completed' | 'failed';
    input_payload: Record<string, any> | null;
    output_payload: Record<string, any> | null;
    model_used: string | null;
    prompt_used: string | null;
    config_used: Record<string, any> | null;
    error_message: string | null;
    start_time: Date;
    end_time: Date | null;
    duration_ms: number | null;
}

export interface Documentation {
    id: string;
    doc_key: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface HedraGoal {
    id: string;
    section_key: 'main_goal' | 'ideas' | 'status';
    content: string;
    lastUpdatedAt: Date;
}

export interface VersionHistory {
    id: string;
    version: string;
    release_date: Date;
    changes: string; // Markdown content
    createdAt: Date;
}

export interface FeatureStatusChartData {
    id: string; 
    label: string;
    value: number;
    color: string;
}

export interface PipelinePerformanceChartData {
    pipeline: 'Context Assembly' | 'Memory Extraction';
    Completed: number;
    Failed: number;
    'Avg Duration (ms)': number;
    [key: string]: string | number;
}

export interface AgentRun {
    id: string;
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    final_result: string | null;
    createdAt: Date;
    completedAt: Date | null;
    duration_ms: number | null;
}

export interface AgentPlanPhase {
    id: string;
    run_id: string;
    phase_order: number;
    goal: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result: string | null;
    steps?: AgentRunStep[];
    started_at?: Date | null;
    completed_at?: Date | null;
}

export interface AgentRunStep {
    id: string;
    run_id: string;
    phase_id?: string;
    step_order: number;
    thought: string | null;
    action_type: 'prompt' | 'tool' | 'finish';
    action_input: Record<string, any> | null;
    observation: string | null;
    createdAt: Date;
}

export type HealthScore = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SubsystemResource {
  name: 'Figma' | 'Google Docs' | 'Notion' | 'GitHub Repo';
  url: string;
}

export interface SubsystemMilestone {
  description: string;
  completed: boolean;
}

export interface SubsystemGitHubStats {
    commits: number;
    pullRequests: number;
    issues: number;
    repoUrl: string;
}

export interface Subsystem {
  id: string;
  name: string;
  description: string;
  progress: number;
  healthScore: HealthScore;
  dependencies: string[];
  resources: SubsystemResource[];
  milestones: SubsystemMilestone[];
  githubStats: SubsystemGitHubStats;
  tasks?: {
      completed: string[];
      remaining: string[];
  }
  orderIndex: number;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    due_date: Date | null;
    completed_at: Date | null;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export type DataSourceType = 'vector' | 'relational_db' | 'document_db' | 'blob' | 'cache' | 'key_value' | 'graph' | 'object_storage' | 'file_system';
export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unsupported' | 'unstable';

export interface DataSource {
    id: string;
    name: string;
    provider: string; // e.g., 'Vercel', 'Pinecone', 'Upstash', 'Self-Hosted'
    type: DataSourceType;
    status: DataSourceStatus;
    stats?: {
        label: string;
        value: string | number;
    }[];
    config_json?: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}