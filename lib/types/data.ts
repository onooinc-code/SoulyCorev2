/**
 * @fileoverview Centralized type definitions for data models.
 */

// --- Core Chat & Conversation ---

export interface Message {
  id: string;
  conversationId: string;
  createdAt: Date;
  role: 'user' | 'model';
  content: string;
  tokenCount?: number;
  responseTime?: number;
  isBookmarked?: boolean;
  parentMessageId?: string | null;
  tags?: string[];
  threadMessages?: Message[];
}

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
  enableMemoryExtraction?: boolean;
}

// --- Memory & Knowledge ---

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

export interface Entity {
  id: string;
  name: string;
  type: string;
  details_json: string;
  createdAt: Date;
}

export interface Brain {
    id: string;
    name: string;
    config_json: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}


// --- Prompts & Workflows ---

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
  folder?: string | null;
  tags?: string[] | null;
  type: 'single' | 'chain';
  chain_definition?: PromptChainStep[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

// --- Tools & Agents ---

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  schema_json: string | Record<string, any>;
  createdAt: Date;
  lastUpdatedAt: Date;
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
  steps?: AgentRunStep[];
  result: string | null;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface AgentRunStep {
  id: string;
  run_id: string;
  phase_id: string | null;
  step_order: number;
  thought: string | null;
  action_type: string;
  action_input: Record<string, any> | null;
  observation: string | null;
  createdAt: Date;
}


// --- Tasks ---

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  status: 'todo' | 'in_progress' | 'completed';
  completed_at: Date | null;
  createdAt: Date;
  lastUpdatedAt: Date;
}


// --- Development & QA ---

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
    notes: string | null;
    lastUpdatedAt: Date;
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


// --- System & Project ---

export interface VersionHistory {
    id: string;
    version: string;
    release_date: string; // or Date
    changes: string;
    createdAt: Date;
}

export interface Documentation {
  id: string;
  doc_key: string;
  title: string;
  content: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface HedraGoal {
  id: string;
  section_key: string;
  content: string;
  createdAt: Date;
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
  orderIndex: number;
}


// --- Data Hub ---

export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unstable' | 'unsupported';
export type DataSourceType = 'relational_db' | 'vector' | 'blob' | 'cache' | 'document_db' | 'file_system' | 'graph' | 'key_value' | 'object_storage';

export interface DataSource {
  id: string;
  name: string;
  provider: string;
  type: DataSourceType;
  status: DataSourceStatus;
  config_json: Record<string, any> | null;
  stats_json: { label: string; value: string | number }[] | null;
  createdAt: Date;
  lastUpdatedAt: Date;
}


// --- Pipelines ---
export interface PipelineRun {
  id: string;
  message_id: string;
  pipeline_type: 'ContextAssembly' | 'MemoryExtraction';
  status: 'running' | 'completed' | 'failed' | 'not_found';
  final_output: string | null;
  final_llm_prompt: string | null;
  final_system_instruction: string | null;
  model_config_json: Record<string, any> | null;
  duration_ms: number | null;
  createdAt: Date;
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
  config_used: Record<string, any> | null;
  prompt_used: string | null;
  error_message: string | null;
  duration_ms: number;
  createdAt: Date;
}

// --- Charting ---
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
