// scripts/create-tables.js
const { db } = require('@vercel/postgres');

async function createTables() {
    const client = await db.connect();
    try {
        await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

        console.log("Creating/Altering tables for Advanced Segmentation & Entity Framework (v3.3)...");

        // --- Core Conversation Tables (largely unchanged) ---
        await client.sql`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
                "enableAutoSummarization" BOOLEAN DEFAULT false,
                ui_settings JSONB,
                topics JSONB
            );
        `;

        await client.sql`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "conversationId" UUID REFERENCES conversations(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                "tokenCount" INTEGER,
                "responseTime" INTEGER,
                "isBookmarked" BOOLEAN DEFAULT false,
                parent_message_id UUID,
                tags TEXT[],
                content_summary TEXT
            );
        `;
        
        // --- New Segmentation Tables ---
        await client.sql`
            CREATE TABLE IF NOT EXISTS segments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                type VARCHAR(50) NOT NULL -- e.g., 'Impact', 'Topic'
            );
        `;

        await client.sql`
            CREATE TABLE IF NOT EXISTS message_segments (
                message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
                segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
                confidence_score REAL,
                PRIMARY KEY (message_id, segment_id)
            );
        `;
        
        // --- Advanced Entity & Relationship Tables ---
        
        // Drop old entities table if it exists to replace it
        await client.sql`DROP TABLE IF EXISTS entities CASCADE;`;

        await client.sql`
            CREATE TABLE IF NOT EXISTS entity_definitions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL, -- Canonical name
                type VARCHAR(100) NOT NULL,
                description TEXT, -- LLM-generated description for semantic meaning
                aliases JSONB, -- Array of alternative names, e.g., ["J. Doe", "John", "جون دو"]
                "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, type)
            );
        `;

        await client.sql`
            CREATE TABLE IF NOT EXISTS message_entities (
                message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
                entity_id UUID REFERENCES entity_definitions(id) ON DELETE CASCADE,
                PRIMARY KEY (message_id, entity_id)
            );
        `;

        await client.sql`
            CREATE TABLE IF NOT EXISTS entity_relationships (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                source_entity_id UUID REFERENCES entity_definitions(id) ON DELETE CASCADE,
                target_entity_id UUID REFERENCES entity_definitions(id) ON DELETE CASCADE,
                predicate VARCHAR(100) NOT NULL, -- e.g., 'works_at', 'manages', 'depends_on'
                context TEXT, -- Description of the context where this relationship was inferred
                "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `;


        // --- Other existing tables ---
        await client.sql`
            CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                company VARCHAR(255),
                phone VARCHAR(50),
                notes TEXT,
                tags TEXT[],
                "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, email)
            );
        `;
        
        // ... (all other tables from the original file remain unchanged) ...
        await client.sql`CREATE TABLE IF NOT EXISTS user_profiles ( user_id VARCHAR(255) PRIMARY KEY, profile_data JSONB, last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS prompts ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, content TEXT NOT NULL, folder VARCHAR(255), tags TEXT[], type VARCHAR(50) DEFAULT 'single', chain_definition JSONB, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS tools ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) UNIQUE NOT NULL, description TEXT, schema_json JSONB, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS tasks ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, description TEXT, due_date TIMESTAMPTZ, status VARCHAR(50) DEFAULT 'todo', completed_at TIMESTAMPTZ, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS documents ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), filename VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, storage_url TEXT NOT NULL, size_bytes INTEGER, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS features ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) UNIQUE NOT NULL, overview TEXT, status VARCHAR(50) NOT NULL, ui_ux_breakdown_json JSONB, logic_flow TEXT, key_files_json JSONB, notes TEXT, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS feature_tests ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "featureId" UUID REFERENCES features(id) ON DELETE CASCADE, description TEXT NOT NULL, manual_steps TEXT, expected_result TEXT NOT NULL, last_run_at TIMESTAMPTZ, last_run_status VARCHAR(50) DEFAULT 'Not Run', "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS api_endpoints ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), method VARCHAR(10) NOT NULL, path VARCHAR(255) UNIQUE NOT NULL, group_name VARCHAR(100), description TEXT, default_params_json JSONB, default_body_json JSONB, expected_status_code INTEGER DEFAULT 200, last_test_at TIMESTAMPTZ, last_test_status VARCHAR(50) DEFAULT 'Not Run' );`;
        await client.sql`CREATE TABLE IF NOT EXISTS endpoint_test_logs ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE, status VARCHAR(50) NOT NULL, status_code INTEGER NOT NULL, response_body JSONB, response_headers JSONB, duration_ms INTEGER, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS subsystems ( id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, progress INTEGER, "healthScore" VARCHAR(10), dependencies JSONB, resources JSONB, milestones JSONB, "githubStats" JSONB, tasks JSONB, order_index INTEGER );`;
        await client.sql`CREATE TABLE IF NOT EXISTS brains ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) UNIQUE NOT NULL, config_json JSONB, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS pipeline_runs ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), message_id UUID UNIQUE, pipeline_type VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, final_output TEXT, final_llm_prompt TEXT, final_system_instruction TEXT, model_config_json JSONB, duration_ms INTEGER, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS pipeline_run_steps ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), run_id UUID REFERENCES pipeline_runs(id) ON DELETE CASCADE, step_order INTEGER NOT NULL, step_name VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, input_payload JSONB, output_payload JSONB, model_used VARCHAR(255), config_used JSONB, prompt_used TEXT, error_message TEXT, duration_ms INTEGER );`;
        await client.sql`CREATE TABLE IF NOT EXISTS agent_runs ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), goal TEXT NOT NULL, status VARCHAR(50) NOT NULL, final_result TEXT, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMPTZ, duration_ms INTEGER );`;
        await client.sql`CREATE TABLE IF NOT EXISTS agent_run_phases ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE, phase_order INTEGER NOT NULL, goal TEXT NOT NULL, status VARCHAR(50) NOT NULL, result TEXT, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ );`;
        await client.sql`CREATE TABLE IF NOT EXISTS agent_run_steps ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE, phase_id UUID REFERENCES agent_run_phases(id) ON DELETE CASCADE, step_order INTEGER NOT NULL, thought TEXT, action_type VARCHAR(50) NOT NULL, action_input JSONB, observation TEXT, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS settings ( key VARCHAR(255) PRIMARY KEY, value JSONB );`;
        await client.sql`CREATE TABLE IF NOT EXISTS logs ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, message TEXT NOT NULL, payload JSONB, level VARCHAR(50) NOT NULL );`;
        await client.sql`CREATE TABLE IF NOT EXISTS version_history ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), version VARCHAR(50) UNIQUE NOT NULL, release_date TIMESTAMPTZ NOT NULL, changes TEXT NOT NULL );`;
        await client.sql`CREATE TABLE IF NOT EXISTS hedra_goals ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), section_key VARCHAR(255) UNIQUE NOT NULL, content TEXT, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS documentations ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), doc_key VARCHAR(255) UNIQUE NOT NULL, title VARCHAR(255), content TEXT, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;
        await client.sql`CREATE TABLE IF NOT EXISTS data_sources ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) UNIQUE NOT NULL, provider VARCHAR(100) NOT NULL, type VARCHAR(100) NOT NULL, status VARCHAR(100) NOT NULL, config_json JSONB, stats_json JSONB, "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, "lastUpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`;


        console.log("Tables created/altered successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
        throw error;
    } finally {
        await client.release();
    }
}

createTables().catch(err => {
    console.error("Database initialization failed:", err);
    process.exit(1);
});
