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
    uiSettings?: Record<string, any>;
    useSemanticMemory?: boolean;
    useStructuredMemory?: boolean;
    enableMemoryExtraction?: boolean;
    brainId?: string | null;
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
    contentSummary?: string;
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
    tags?: string[];
    provenance?: any;
    version: number;
    brainId?: string | null;
    vectorId?: string;
    accessCount?: number;
    lastAccessedAt?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface PredicateDefinition {
    id: string;
    name: string;
    description?: string;
    isTransitive?: boolean;
    isSymmetric?: boolean;
    createdAt: Date;
}

export interface EntityRelationship {
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    predicateId: string;
    context?: string;
    provenance?: any;
    brainId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    lastVerifiedAt?: Date;
    verificationStatus?: string;
    confidenceScore?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
}

export interface EntityHistoryLog {
    id: string;
    entityId: string;
    fieldName: string;
    oldValue?: string;
    newValue?: string;
    version: number;
    changedBy: string;
    changedAt: Date;
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
    chainDefinition?: PromptChainStep[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    schemaJson: any; // Gemini FunctionDeclaration schema
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface AgentRun {
    id: string;
    goal: string;
    status: 'planning' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
    resultSummary?: string;
    createdAt: Date;
    completedAt?: Date;
}

export interface AgentPlanPhase {
    id: string;
    runId: string;
    phaseOrder: number;
    goal: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    startedAt?: Date;
    completedAt?: Date;
}

export interface AgentRunStep {
    id: string;
    runId: string;
    phaseId: string;
    stepOrder: number;
    thought: string;
    action: string;
    actionInput: Record<string, any>;
    observation: string;
    status: 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
}

export type DataSourceType = 'relational_db' | 'vector' | 'blob' | 'cache' | 'document_db' | 'file_system' | 'graph' | 'key_value' | 'object_storage';
export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'needs_config' | 'full' | 'unstable' | 'unsupported';

export interface DataSource {
    id: string;
    name: string;
    provider: string;
    type: DataSourceType;
    status: DataSourceStatus;
    configJson: Record<string, any>;
    statsJson: { label: string; value: string | number }[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

export type ApiTestStatus = 'Passed' | 'Failed' | 'Not Run';

export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    groupName: string;
    description?: string;
    defaultParamsJson?: Record<string, any>;
    defaultBodyJson?: Record<string, any>;
    expectedStatusCode: number;
    lastTestAt?: Date;
    lastTestStatus: ApiTestStatus;
    createdAt: Date;
}

export interface EndpointTestLog {
    id: string;
    endpointId: string;
    status: 'Passed' | 'Failed';
    statusCode: number;
    responseBody: Record<string, any>;
    responseHeaders: Record<string, any>;
    durationMs: number;
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
    category?: string;
    uiUxBreakdownJson: UiUxSubFeature[] | string;
    logicFlow: string;
    keyFilesJson: string[] | string;
    notes?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export type TestStatus = 'Passed' | 'Failed' | 'Not Run';
export interface FeatureTest {
    id: string;
    featureId: string;
    description: string;
    manualSteps?: string;
    expectedResult: string;
    lastRunStatus: TestStatus;
    lastRunAt?: Date;
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
    dueDate?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface ProjectTask {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    orderIndex: number;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    status: 'todo' | 'in_progress' | 'completed';
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Experience {
    id: string;
    sourceRunId: string;
    goalTemplate: string;
    triggerKeywords: string[];
    stepsJson: Record<string, any>;
    usageCount: number;
    lastUsedAt?: Date;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface CommChannel {
    id: string;
    name: string;
    type: 'webhook' | 'email_inbound' | 'app_broadcast';
    status: 'active' | 'inactive' | 'error';
    configJson: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface PipelineRun {
    id: string;
    messageId: string;
    pipelineType: 'ContextAssembly' | 'MemoryExtraction';
    status: 'running' | 'completed' | 'failed' | 'not_found';
    durationMs: number;
    finalOutput: string;
    finalLlmPrompt: string;
    finalSystemInstruction: string;
    modelConfigJson: Record<string, any>;
    createdAt: Date;
}

export interface PipelineRunStep {
    id: string;
    runId: string;
    stepOrder: number;
    stepName: string;
    inputPayload: Record<string, any>;
    outputPayload?: Record<string, any>;
    durationMs: number;
    status: 'completed' | 'failed';
    errorMessage?: string;
    modelUsed?: string;
    promptUsed?: string;
    configUsed?: Record<string, any>;
    timestamp: Date;
}

export interface VersionHistory {
    id: string;
    version: string;
    releaseDate: Date;
    changes: string;
    createdAt: Date;
}

export interface Documentation {
    id: string;
    docKey: string;
    title: string;
    content: string;
    lastUpdatedAt: Date;
}

export interface HedraGoal {
    sectionKey: string;
    content: string | null;
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
    configJson: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface Event {
    id: string;
    type: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    provenance?: any;
    brainId?: string | null;
    createdAt: Date;
}

export interface EventParticipant {
    id: string;
    eventId: string;
    entityId: string;
    role: string;
}

export type ValidationRuleType = 'unique_across_types' | 'min_length';
export interface ValidationRule {
    field: 'name' | 'description';
    rule: ValidationRuleType;
    params?: any[];
    errorMessage: string;
}
export interface EntityTypeValidationRules {
    id: string;
    entityType: string;
    rulesJson: ValidationRule[];
    createdAt: Date;
    lastUpdatedAt: Date;
}

// FIX: Added ILinkPredictionProposal type to be shared across core and components.
export interface ILinkPredictionProposal {
    sourceEntity: Pick<EntityDefinition, 'id' | 'name'>;
    targetEntity: Pick<EntityDefinition, 'id' | 'name'>;
    suggestedPredicate: string;
}

// FIX: Added SearchResult type definition to resolve import errors in unified search features.
export interface SearchResult {
    id: string;
    type: 'conversation' | 'contact' | 'relationship' | 'archive' | string;
    title: string;
    content: string | null;
    source: string;
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
    [key: string]: string | number;
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
    startDate?: Date | null;
    endDate?: Date | null;
    confidenceScore?: number;
    metadata?: Record<string, any>;
}
export interface RelationshipGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

// Make sure this file is treated as a module
export {};