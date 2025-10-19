require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function createTables() {
  console.log("Starting table creation...");
  const client = await sql.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "systemPrompt" TEXT,
        "useSemanticMemory" BOOLEAN DEFAULT true,
        "useStructuredMemory" BOOLEAN DEFAULT true,
        "useGraphMemory" BOOLEAN DEFAULT false,
        "useDocumentMemory" BOOLEAN DEFAULT false,
        model VARCHAR(255) DEFAULT 'gemini-2.5-flash',
        temperature REAL DEFAULT 0.7,
        "topP" REAL DEFAULT 0.95,
        ui_settings JSONB,
        "enableMemoryExtraction" BOOLEAN DEFAULT true,
        "enableProactiveSuggestions" BOOLEAN DEFAULT true,
        "enableAutoSummarization" BOOLEAN DEFAULT true
      );
    `);
    console.log("Table 'conversations' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "tokenCount" INTEGER,
        "responseTime" INTEGER,
        "isBookmarked" BOOLEAN DEFAULT false,
        parent_message_id UUID,
        tags TEXT[]
      );
    `);
    console.log("Table 'messages' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        company VARCHAR(255),
        phone VARCHAR(50),
        notes TEXT,
        tags TEXT[],
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (name, email)
      );
    `);
    console.log("Table 'contacts' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        details_json TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (name, type)
      );
    `);
    console.log("Table 'entities' created or already exists.");
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(255) PRIMARY KEY,
            value JSONB
        );
    `);
    console.log("Table 'settings' created or already exists.");

    await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            message TEXT NOT NULL,
            payload JSONB,
            level VARCHAR(20) NOT NULL
        );
    `);
    console.log("Table 'logs' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        overview TEXT,
        status VARCHAR(50) NOT NULL,
        ui_ux_breakdown_json JSONB,
        logic_flow TEXT,
        key_files_json JSONB,
        notes TEXT,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'features' created or already exists.");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "featureId" UUID REFERENCES features(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        manual_steps TEXT,
        expected_result TEXT NOT NULL,
        last_run_status VARCHAR(50) DEFAULT 'Not Run',
        last_run_at TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'feature_tests' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS api_endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        method VARCHAR(10) NOT NULL,
        path VARCHAR(255) UNIQUE NOT NULL,
        group_name VARCHAR(100) NOT NULL,
        description TEXT,
        default_params_json JSONB,
        default_body_json JSONB,
        expected_status_code INTEGER DEFAULT 200,
        last_test_status VARCHAR(50) DEFAULT 'Not Run',
        last_test_at TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'api_endpoints' created or already exists.");

    await client.query(`
       CREATE TABLE IF NOT EXISTS endpoint_test_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL,
          status_code INTEGER NOT NULL,
          response_body JSONB,
          response_headers JSONB,
          duration_ms INTEGER,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
       );
    `);
    console.log("Table 'endpoint_test_logs' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS brains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        config_json JSONB NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'brains' created or already exists.");
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            message_id UUID,
            pipeline_type VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            final_output TEXT,
            final_llm_prompt TEXT,
            final_system_instruction TEXT,
            model_config_json JSONB,
            start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMPTZ,
            duration_ms INTEGER,
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
     console.log("Table 'pipeline_runs' created or already exists.");

    await client.query(`
        CREATE TABLE IF NOT EXISTS pipeline_run_steps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            run_id UUID REFERENCES pipeline_runs(id) ON DELETE CASCADE,
            step_order INTEGER NOT NULL,
            step_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            input_payload JSONB,
            output_payload JSONB,
            model_used VARCHAR(255),
            config_used JSONB,
            prompt_used TEXT,
            error_message TEXT,
            duration_ms INTEGER,
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Table 'pipeline_run_steps' created or already exists.");
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS prompts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            folder VARCHAR(255),
            tags TEXT[],
            type VARCHAR(50) DEFAULT 'single',
            chain_definition JSONB,
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Table 'prompts' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS version_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(50) UNIQUE NOT NULL,
        release_date TIMESTAMPTZ NOT NULL,
        changes TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'version_history' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS documentations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doc_key VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'documentations' created or already exists.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS hedra_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_key VARCHAR(100) UNIQUE NOT NULL,
        content TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'hedra_goals' created or already exists.");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS subsystems (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        progress INTEGER,
        "healthScore" VARCHAR(10),
        dependencies JSONB,
        resources JSONB,
        milestones JSONB,
        "githubStats" JSONB,
        tasks JSONB,
        order_index INTEGER
      );
    `);
    console.log("Table 'subsystems' created or already exists.");

     await client.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        schema_json JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'tools' created or already exists.");
    
     await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        due_date TIMESTAMPTZ,
        status VARCHAR(50) DEFAULT 'todo',
        completed_at TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'tasks' created or already exists.");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        provider VARCHAR(100),
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'needs_config',
        config_json JSONB,
        stats_json JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'data_sources' created or already exists.");


    console.log("All tables created or verified successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  } finally {
    await client.release();
  }
}

createTables().catch(err => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
