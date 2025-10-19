const { sql } = require('@vercel/postgres');

async function createTables() {
  const client = await sql.connect();
  try {
    // Basic application tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        summary TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "systemPrompt" TEXT,
        "useSemanticMemory" BOOLEAN DEFAULT true,
        "useStructuredMemory" BOOLEAN DEFAULT true,
        model VARCHAR(255),
        temperature REAL,
        "topP" REAL,
        "enableMemoryExtraction" BOOLEAN DEFAULT true,
        "enableProactiveSuggestions" BOOLEAN DEFAULT true,
        "enableAutoSummarization" BOOLEAN DEFAULT true,
        ui_settings JSONB
      );
    `);
    console.log('Created "conversations" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        content_summary TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "tokenCount" INTEGER,
        "responseTime" INTEGER,
        "isBookmarked" BOOLEAN DEFAULT false,
        parent_message_id UUID,
        tags TEXT[]
      );
    `);
    console.log('Created "messages" table');

    // Memory system tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        company VARCHAR(255),
        phone VARCHAR(50),
        notes TEXT,
        tags TEXT[],
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "contacts" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS entity_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        description TEXT,
        aliases JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (name, type)
      );
    `);
    console.log('Created "entity_definitions" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS entity_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_entity_id UUID REFERENCES entity_definitions(id) ON DELETE CASCADE,
        target_entity_id UUID REFERENCES entity_definitions(id) ON DELETE CASCADE,
        predicate VARCHAR(255) NOT NULL,
        context TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "entity_relationships" table');

     await client.query(`
      CREATE TABLE IF NOT EXISTS message_entities (
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        entity_id UUID REFERENCES entity_definitions(id) ON DELETE CASCADE,
        PRIMARY KEY (message_id, entity_id)
      );
    `);
    console.log('Created "message_entities" table');

    // Segments for conversation grouping
    await client.query(`
      CREATE TABLE IF NOT EXISTS segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "segments" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS message_segments (
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
        PRIMARY KEY (message_id, segment_id)
      );
    `);
    console.log('Created "message_segments" table');

    // Prompts & Tools
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
    console.log('Created "prompts" table');

     await client.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        schema_json JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "tools" table');

    // Agent Center tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        result_summary TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMPTZ
      );
    `);
    console.log('Created "agent_runs" table');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_run_phases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
          phase_order INTEGER NOT NULL,
          goal TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          result TEXT,
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ
      );
    `);
    console.log('Created "agent_run_phases" table');


    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_run_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
        phase_id UUID REFERENCES agent_run_phases(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        thought TEXT,
        action VARCHAR(255),
        action_input JSONB,
        observation TEXT,
        status VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "agent_run_steps" table');
    
    // NEW: Table for learned experiences
    await client.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
        goal_template TEXT NOT NULL,
        trigger_keywords TEXT[],
        steps_json JSONB,
        confidence_score REAL DEFAULT 0.8,
        usage_count INTEGER DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "experiences" table');


    // Developer & System tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        overview TEXT,
        status VARCHAR(50) NOT NULL,
        ui_ux_breakdown_json JSONB,
        logic_flow TEXT,
        key_files_json JSONB,
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "features" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "featureId" UUID REFERENCES features(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        manual_steps TEXT,
        expected_result TEXT NOT NULL,
        last_run_status VARCHAR(50) DEFAULT 'Not Run',
        last_run_at TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "feature_tests" table');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        message TEXT NOT NULL,
        payload JSONB,
        level VARCHAR(10) NOT NULL
      );
    `);
    console.log('Created "logs" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pipeline_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        pipeline_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        duration_ms INTEGER,
        final_output TEXT,
        final_llm_prompt TEXT,
        final_system_instruction TEXT,
        model_config_json JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "pipeline_runs" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pipeline_run_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID REFERENCES pipeline_runs(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        step_name VARCHAR(255) NOT NULL,
        input_payload JSONB,
        output_payload JSONB,
        duration_ms INTEGER,
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        model_used VARCHAR(255),
        prompt_used TEXT,
        config_used JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "pipeline_run_steps" table');
    
    await client.query(`
       CREATE TABLE IF NOT EXISTS version_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(50) NOT NULL UNIQUE,
        release_date TIMESTAMPTZ NOT NULL,
        changes TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "version_history" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS api_endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        method VARCHAR(10) NOT NULL,
        path VARCHAR(255) NOT NULL UNIQUE,
        group_name VARCHAR(100) NOT NULL,
        description TEXT,
        default_params_json JSONB,
        default_body_json JSONB,
        expected_status_code INTEGER DEFAULT 200,
        last_test_at TIMESTAMPTZ,
        last_test_status VARCHAR(50) DEFAULT 'Not Run',
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
     console.log('Created "api_endpoints" table');

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
    console.log('Created "endpoint_test_logs" table');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS brains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        config_json JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "brains" table');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hedra_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_key VARCHAR(100) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "hedra_goals" table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS documentations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doc_key VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "documentations" table');
    
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
    console.log('Created "subsystems" table');
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            due_date TIMESTAMPTZ,
            status VARCHAR(50) DEFAULT 'todo',
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            "completed_at" TIMESTAMPTZ
        );
    `);
    console.log('Created "tasks" table');
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS data_sources (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL UNIQUE,
            provider VARCHAR(100) NOT NULL,
            type VARCHAR(100) NOT NULL,
            status VARCHAR(100) NOT NULL,
            config_json JSONB,
            stats_json JSONB,
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Created "data_sources" table');

    await client.query(`
        CREATE TABLE IF NOT EXISTS comm_channels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            status VARCHAR(100) NOT NULL,
            config_json JSONB,
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Created "comm_channels" table');


  } finally {
    await client.end();
  }
}

createTables().catch(err => {
  console.error('Error creating tables:', err);
  process.exit(1);
});