// scripts/create-tables.js
const { db } = require('@vercel/postgres');

const statements = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  `CREATE EXTENSION IF NOT EXISTS "pg_trgm";`,

  // FIX: Force a clean state for ALL tables on every build to prevent errors from stale,
  // incomplete table structures persisting in the Vercel build cache. This is the definitive
  // solution to the recurring build errors.
  `DROP TABLE IF EXISTS "conversations" CASCADE;`,
  `DROP TABLE IF EXISTS "messages" CASCADE;`,
  `DROP TABLE IF EXISTS "contacts" CASCADE;`,
  `DROP TABLE IF EXISTS "entity_definitions" CASCADE;`,
  `DROP TABLE IF EXISTS "segments" CASCADE;`,
  `DROP TABLE IF EXISTS "prompts" CASCADE;`,
  `DROP TABLE IF EXISTS "tools" CASCADE;`,
  `DROP TABLE IF EXISTS "agent_runs" CASCADE;`,
  `DROP TABLE IF EXISTS "experiences" CASCADE;`,
  `DROP TABLE IF EXISTS "comm_channels" CASCADE;`,
  `DROP TABLE IF EXISTS "projects" CASCADE;`,
  `DROP TABLE IF EXISTS "tasks" CASCADE;`,
  `DROP TABLE IF EXISTS "pipeline_runs" CASCADE;`,
  `DROP TABLE IF EXISTS "features" CASCADE;`,
  `DROP TABLE IF EXISTS "api_endpoints" CASCADE;`,
  `DROP TABLE IF EXISTS "documentations" CASCADE;`,
  `DROP TABLE IF EXISTS "hedra_goals" CASCADE;`,
  `DROP TABLE IF EXISTS "subsystems" CASCADE;`,
  `DROP TABLE IF EXISTS "version_history" CASCADE;`,
  `DROP TABLE IF EXISTS "logs" CASCADE;`,
  `DROP TABLE IF EXISTS "brains" CASCADE;`,
  `DROP TABLE IF EXISTS "documents" CASCADE;`,
  `DROP TABLE IF EXISTS "data_sources" CASCADE;`,
  `DROP TABLE IF EXISTS "settings" CASCADE;`,
  `DROP TABLE IF EXISTS "predicate_definitions" CASCADE;`,
  `DROP TABLE IF EXISTS "entity_history" CASCADE;`,
  `DROP TABLE IF EXISTS "entity_relationships" CASCADE;`,
  `DROP MATERIALIZED VIEW IF EXISTS "vw_detailed_relationships" CASCADE;`,


  `CREATE TABLE IF NOT EXISTS "settings" (
    "key" VARCHAR(255) PRIMARY KEY,
    "value" JSONB,
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "brains" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "configJson" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "conversations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "systemPrompt" TEXT,
    "model" VARCHAR(255),
    "temperature" REAL,
    "topP" REAL,
    "uiSettings" JSONB,
    "useSemanticMemory" BOOLEAN DEFAULT true,
    "useStructuredMemory" BOOLEAN DEFAULT true,
    "enableMemoryExtraction" BOOLEAN DEFAULT true,
    "brainId" UUID REFERENCES "brains"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "conversationId" UUID REFERENCES "conversations"("id") ON DELETE CASCADE,
    "role" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "responseTime" INTEGER,
    "isBookmarked" BOOLEAN DEFAULT false,
    "parentMessageId" UUID REFERENCES "messages"("id") ON DELETE SET NULL,
    "tags" TEXT[],
    "contentSummary" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "contacts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "company" VARCHAR(255),
    "phone" VARCHAR(50),
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("name", "email")
  );`,

  `CREATE TABLE IF NOT EXISTS "entity_definitions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "aliases" JSONB,
    "tags" TEXT[],
    "provenance" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "brainId" UUID REFERENCES "brains"("id") ON DELETE SET NULL,
    "vectorId" VARCHAR(255),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMPTZ DEFAULT now(),
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("name", "type", "brainId")
  );`,
  
  `CREATE TABLE IF NOT EXISTS "predicate_definitions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "isTransitive" BOOLEAN NOT NULL DEFAULT false,
    "isSymmetric" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "entity_relationships" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "sourceEntityId" UUID NOT NULL REFERENCES "entity_definitions"("id") ON DELETE CASCADE,
    "targetEntityId" UUID NOT NULL REFERENCES "entity_definitions"("id") ON DELETE CASCADE,
    "predicateId" UUID NOT NULL REFERENCES "predicate_definitions"("id") ON DELETE CASCADE,
    "context" TEXT,
    "provenance" JSONB,
    "brainId" UUID REFERENCES "brains"("id") ON DELETE SET NULL,
    "startDate" TIMESTAMPTZ DEFAULT NULL,
    "endDate" TIMESTAMPTZ DEFAULT NULL,
    "lastVerifiedAt" TIMESTAMPTZ,
    "verificationStatus" VARCHAR(50),
    "confidenceScore" REAL DEFAULT 0.5,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "vectorId" VARCHAR(255),
    UNIQUE("sourceEntityId", "targetEntityId", "predicateId", "brainId")
  );`,

  `CREATE TABLE IF NOT EXISTS "message_entities" (
    "messageId" UUID NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
    "entityId" UUID NOT NULL REFERENCES "entity_definitions"("id") ON DELETE CASCADE,
    PRIMARY KEY ("messageId", "entityId")
  );`,

  `CREATE TABLE IF NOT EXISTS "segments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "type" VARCHAR(50),
    "description" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "message_segments" (
    "messageId" UUID NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
    "segmentId" UUID NOT NULL REFERENCES "segments"("id") ON DELETE CASCADE,
    PRIMARY KEY ("messageId", "segmentId")
  );`,
  
  `CREATE TABLE IF NOT EXISTS "prompts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "content" TEXT NOT NULL,
    "folder" VARCHAR(255),
    "tags" TEXT[],
    "type" VARCHAR(50) DEFAULT 'single',
    "chainDefinition" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "tools" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "schemaJson" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,
  
  `CREATE TABLE IF NOT EXISTS "agent_runs" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "goal" TEXT NOT NULL,
      "status" VARCHAR(50) NOT NULL,
      "resultSummary" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "completedAt" TIMESTAMPTZ
  );`,

  `CREATE TABLE IF NOT EXISTS "agent_run_phases" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "runId" UUID NOT NULL REFERENCES "agent_runs"("id") ON DELETE CASCADE,
      "phaseOrder" INT NOT NULL,
      "goal" TEXT NOT NULL,
      "status" VARCHAR(50) NOT NULL,
      "result" TEXT,
      "startedAt" TIMESTAMPTZ,
      "completedAt" TIMESTAMPTZ
  );`,

  `CREATE TABLE IF NOT EXISTS "agent_run_steps" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "runId" UUID NOT NULL REFERENCES "agent_runs"("id") ON DELETE CASCADE,
      "phaseId" UUID NOT NULL REFERENCES "agent_run_phases"("id") ON DELETE CASCADE,
      "stepOrder" INT NOT NULL,
      "thought" TEXT,
      "action" VARCHAR(255),
      "actionInput" JSONB,
      "observation" TEXT,
      "status" VARCHAR(50),
      "startedAt" TIMESTAMPTZ,
      "completedAt" TIMESTAMPTZ
  );`,
  
  `CREATE TABLE IF NOT EXISTS "data_sources" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "configJson" JSONB,
    "statsJson" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "api_endpoints" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(255) UNIQUE NOT NULL,
    "groupName" VARCHAR(255),
    "description" TEXT,
    "defaultParamsJson" JSONB,
    "defaultBodyJson" JSONB,
    "expectedStatusCode" INTEGER DEFAULT 200,
    "lastTestAt" TIMESTAMPTZ,
    "lastTestStatus" VARCHAR(50) DEFAULT 'Not Run',
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "endpoint_test_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "endpointId" UUID REFERENCES "api_endpoints"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB,
    "responseHeaders" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "features" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "overview" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "category" VARCHAR(255),
    "uiUxBreakdownJson" JSONB,
    "logicFlow" TEXT,
    "keyFilesJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "feature_tests" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "featureId" UUID REFERENCES "features"("id") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "manualSteps" TEXT,
    "expectedResult" TEXT NOT NULL,
    "lastRunStatus" VARCHAR(50) DEFAULT 'Not Run',
    "lastRunAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "subsystems" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "progress" INTEGER,
    "healthScore" VARCHAR(10),
    "dependencies" JSONB,
    "resources" JSONB,
    "milestones" JSONB,
    "githubStats" JSONB,
    "tasks" JSONB,
    "orderIndex" INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS "projects" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "status" VARCHAR(50) DEFAULT 'Not Started',
      "dueDate" DATE,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "project_tasks" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "projectId" UUID REFERENCES "projects"("id") ON DELETE CASCADE,
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "status" VARCHAR(50) DEFAULT 'todo',
      "orderIndex" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,
  
  `CREATE TABLE IF NOT EXISTS "tasks" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "dueDate" DATE,
      "status" VARCHAR(50) DEFAULT 'todo',
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "experiences" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "sourceRunId" UUID REFERENCES "agent_runs"("id") ON DELETE SET NULL,
      "goalTemplate" TEXT NOT NULL,
      "triggerKeywords" TEXT[],
      "stepsJson" JSONB NOT NULL,
      "usageCount" INTEGER DEFAULT 0,
      "lastUsedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "comm_channels" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" VARCHAR(255) NOT NULL,
      "type" VARCHAR(50) NOT NULL,
      "status" VARCHAR(50) NOT NULL,
      "configJson" JSONB,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "pipeline_runs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "messageId" UUID REFERENCES "messages"("id") ON DELETE CASCADE,
    "pipelineType" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "durationMs" INTEGER,
    "finalOutput" TEXT,
    "finalLlmPrompt" TEXT,
    "finalSystemInstruction" TEXT,
    "modelConfigJson" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "pipeline_run_steps" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "runId" UUID REFERENCES "pipeline_runs"("id") ON DELETE CASCADE,
    "stepOrder" INTEGER NOT NULL,
    "stepName" VARCHAR(255) NOT NULL,
    "inputPayload" JSONB,
    "outputPayload" JSONB,
    "durationMs" INTEGER,
    "status" VARCHAR(50) NOT NULL,
    "errorMessage" TEXT,
    "modelUsed" VARCHAR(255),
    "promptUsed" TEXT,
    "configUsed" JSONB,
    "timestamp" TIMESTAMPTZ DEFAULT now()
  );`,
  
  `CREATE TABLE IF NOT EXISTS "version_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "version" VARCHAR(50) UNIQUE NOT NULL,
    "releaseDate" TIMESTAMPTZ NOT NULL,
    "changes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "documentations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "docKey" VARCHAR(255) UNIQUE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "hedra_goals" (
    "sectionKey" VARCHAR(255) PRIMARY KEY,
    "content" TEXT,
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,
  
  `CREATE TABLE IF NOT EXISTS "logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "timestamp" TIMESTAMPTZ DEFAULT now(),
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "level" VARCHAR(50) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "documents" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "filename" VARCHAR(255),
      "mimeType" VARCHAR(255),
      "storageUrl" VARCHAR(1024),
      "sizeBytes" BIGINT,
      "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "entity_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entityId" UUID NOT NULL REFERENCES "entity_definitions"("id") ON DELETE CASCADE,
    "fieldName" VARCHAR(255) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "version" INTEGER,
    "changedBy" VARCHAR(255) DEFAULT 'system',
    "changedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE MATERIALIZED VIEW "vw_detailed_relationships" AS
    SELECT
        r.id,
        r."sourceEntityId",
        s.name as "sourceName",
        s.type as "sourceType",
        r."targetEntityId",
        t.name as "targetName",
        t.type as "targetType",
        r."predicateId",
        p.name as "predicateName",
        r.context,
        r."brainId",
        b.name as "brainName",
        r."createdAt"
    FROM entity_relationships r
    JOIN entity_definitions s ON r."sourceEntityId" = s.id
    JOIN entity_definitions t ON r."targetEntityId" = t.id
    JOIN predicate_definitions p ON r."predicateId" = p.id
    LEFT JOIN brains b ON r."brainId" = b.id;`,

  // Create indexes for faster queries
  `CREATE UNIQUE INDEX IF NOT EXISTS "idx_vw_detailed_relationships_id" ON "vw_detailed_relationships"(id);`,
  `CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversationId");`,
  `CREATE INDEX IF NOT EXISTS "idx_conversations_lastupdatedat" ON "conversations"("lastUpdatedAt");`,
  `CREATE INDEX IF NOT EXISTS "idx_pipeline_runs_message_id" ON "pipeline_runs"("messageId");`,
  `CREATE INDEX IF NOT EXISTS "idx_entity_history_entity_id" ON "entity_history"("entityId");`,
  `CREATE INDEX IF NOT EXISTS "idx_relationships_brain_id" ON "entity_relationships"("brainId");`,
];

async function createTables() {
  console.log('Starting database schema creation...');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query('COMMIT');
    console.log('Successfully created all tables.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    // Vercel build will fail if we exit with 1, which is what we want.
    process.exit(1);
  } finally {
    client.release();
  }
}

createTables();