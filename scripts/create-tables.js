
// scripts/create-tables.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function createTables() {
    console.log("Executing CREATE TABLE statements...");
    try {
        const conversationsTable = await sql`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "agentId" VARCHAR(255) NOT NULL DEFAULT 'default',
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
        `;
        console.log("Table 'conversations' created or already exists.", conversationsTable.command);

        // Add columns introduced in later versions to support existing databases
        console.log("Ensuring conversation model columns exist...");
        try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS model VARCHAR(255);`;
        } catch (e) {
            // Some very old Postgres versions might not support IF NOT EXISTS, so we still catch.
            if (!e.message.includes('column "model" already exists')) throw e;
        }
        try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS temperature REAL;`;
        } catch (e) {
            if (!e.message.includes('column "temperature" already exists')) throw e;
        }
        try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "topP" REAL;`;
        } catch (e) {
            if (!e.message.includes('column "topP" already exists')) throw e;
        }
        // Add new feature flag columns
         try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "enableMemoryExtraction" BOOLEAN DEFAULT true;`;
        } catch (e) {
            if (!e.message.includes('column "enableMemoryExtraction" already exists')) throw e;
        }
        try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "enableProactiveSuggestions" BOOLEAN DEFAULT true;`;
        } catch (e) {
            if (!e.message.includes('column "enableProactiveSuggestions" already exists')) throw e;
        }
         try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "enableAutoSummarization" BOOLEAN DEFAULT true;`;
        } catch (e) {
            if (!e.message.includes('column "enableAutoSummarization" already exists')) throw e;
        }
         try {
            await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ui_settings JSONB;`;
        } catch (e) {
            if (!e.message.includes('column "ui_settings" already exists')) throw e;
        }
        console.log("Conversation model and feature columns checked.");


        const messagesTable = await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "conversationId" UUID REFERENCES conversations(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "tokenCount" INTEGER,
                "responseTime" INTEGER,
                "isBookmarked" BOOLEAN DEFAULT false,
                parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL
            );
        `;
        console.log("Table 'messages' created or already exists.", messagesTable.command);
        
        // Add parent_message_id for threading
        try {
             await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;`;
        } catch (e) {
            if (!e.message.includes('column "parent_message_id" already exists')) throw e;
        }
        console.log("Messages table columns checked for threading support.");

        const contactsTable = await sql`
            CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                company VARCHAR(255),
                phone VARCHAR(50),
                linkedin_url VARCHAR(255),
                address TEXT,
                tags TEXT[],
                notes TEXT,
                last_contacted_date TIMESTAMP WITH TIME ZONE,
                details_json JSONB,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, email)
            );
        `;
        console.log("Table 'contacts' created or already exists.", contactsTable.command);
        
        const entitiesTable = await sql`
            CREATE TABLE IF NOT EXISTS entities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                type VARCHAR(255) NOT NULL,
                details_json TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, type)
            );
        `;
        console.log("Table 'entities' created or already exists.", entitiesTable.command);
        
        const settingsTable = await sql`
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(255) PRIMARY KEY,
                value JSONB NOT NULL
            );
        `;
        console.log("Table 'settings' created or already exists.", settingsTable.command);
        
        const featuresTable = await sql`
            CREATE TABLE IF NOT EXISTS features (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                overview TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'Planned',
                ui_ux_breakdown_json JSONB,
                logic_flow TEXT,
                key_files_json JSONB,
                notes TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'features' created or already exists.", featuresTable.command);

        const logsTable = await sql`
            CREATE TABLE IF NOT EXISTS logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                message TEXT NOT NULL,
                payload JSONB,
                level VARCHAR(10) NOT NULL DEFAULT 'info'
            );
        `;
        console.log("Table 'logs' created or already exists.", logsTable.command);

        const promptsTable = await sql`
            CREATE TABLE IF NOT EXISTS prompts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                folder VARCHAR(255),
                tags TEXT[],
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                type VARCHAR(50) DEFAULT 'single' NOT NULL,
                chain_definition JSONB
            );
        `;
        console.log("Table 'prompts' created or already exists.", promptsTable.command);

        // Ensure new columns exist for existing deployments
        try {
            await sql`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'single' NOT NULL;`;
        } catch (e) {
            if (!e.message.includes('column "type" already exists')) throw e;
        }
        try {
            await sql`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS chain_definition JSONB;`;
        } catch (e) {
            if (!e.message.includes('column "chain_definition" already exists')) throw e;
        }
        console.log("Prompts table columns checked.");

        const toolsTable = await sql`
            CREATE TABLE IF NOT EXISTS tools (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                schema_json JSONB,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'tools' created or already exists.", toolsTable.command);

        const brainsTable = await sql`
            CREATE TABLE IF NOT EXISTS brains (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL UNIQUE,
                config_json JSONB NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'brains' created or already exists.", brainsTable.command);

        const featureTestsTable = await sql`
            CREATE TABLE IF NOT EXISTS feature_tests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "featureId" UUID REFERENCES features(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                manual_steps TEXT,
                expected_result TEXT NOT NULL,
                last_run_status VARCHAR(50) DEFAULT 'Not Run',
                last_run_at TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'feature_tests' created or already exists.", featureTestsTable.command);

        const apiEndpointsTable = await sql`
            CREATE TABLE IF NOT EXISTS api_endpoints (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                method VARCHAR(10) NOT NULL,
                path VARCHAR(255) NOT NULL UNIQUE,
                group_name VARCHAR(255) NOT NULL,
                description TEXT,
                default_params_json JSONB,
                default_body_json JSONB,
                expected_status_code INTEGER NOT NULL DEFAULT 200,
                last_test_status VARCHAR(50) NOT NULL DEFAULT 'Not Run',
                last_test_at TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'api_endpoints' created or already exists.", apiEndpointsTable.command);

        const endpointTestLogsTable = await sql`
            CREATE TABLE IF NOT EXISTS endpoint_test_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                status_code INTEGER NOT NULL,
                response_body JSONB,
                response_headers JSONB,
                duration_ms INTEGER NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'endpoint_test_logs' created or already exists.", endpointTestLogsTable.command);

        const pipelineRunsTable = await sql`
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
                pipeline_type VARCHAR(50) NOT NULL, -- 'ContextAssembly' or 'MemoryExtraction'
                status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
                final_output TEXT,
                error_message TEXT,
                start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP WITH TIME ZONE,
                duration_ms INTEGER,
                CONSTRAINT uq_message_pipeline UNIQUE(message_id, pipeline_type)
            );
        `;
        console.log("Table 'pipeline_runs' created or already exists.", pipelineRunsTable.command);

        const pipelineRunStepsTable = await sql`
            CREATE TABLE IF NOT EXISTS pipeline_run_steps (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                run_id UUID REFERENCES pipeline_runs(id) ON DELETE CASCADE,
                step_order INTEGER NOT NULL,
                step_name VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL, -- 'completed', 'failed'
                input_payload JSONB,
                output_payload JSONB,
                model_used VARCHAR(255),
                prompt_used TEXT,
                config_used JSONB,
                error_message TEXT,
                start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP WITH TIME ZONE,
                duration_ms INTEGER
            );
        `;
        console.log("Table 'pipeline_run_steps' created or already exists.", pipelineRunStepsTable.command);
        
        const documentationsTable = await sql`
            CREATE TABLE IF NOT EXISTS documentations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                doc_key VARCHAR(255) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'documentations' created or already exists.", documentationsTable.command);

        const hedraGoalsTable = await sql`
            CREATE TABLE IF NOT EXISTS hedra_goals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                section_key VARCHAR(255) NOT NULL UNIQUE,
                content TEXT,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'hedra_goals' created or already exists.", hedraGoalsTable.command);

        const versionHistoryTable = await sql`
            CREATE TABLE IF NOT EXISTS version_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                version VARCHAR(255) NOT NULL UNIQUE,
                release_date TIMESTAMP WITH TIME ZONE NOT NULL,
                changes TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'version_history' created or already exists.", versionHistoryTable.command);

        const agentRunsTable = await sql`
            CREATE TABLE IF NOT EXISTS agent_runs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                goal TEXT NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'running',
                final_result TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "completedAt" TIMESTAMP WITH TIME ZONE,
                duration_ms INTEGER
            );
        `;
        console.log("Table 'agent_runs' created or already exists.", agentRunsTable.command);

        const agentRunPhasesTable = await sql`
            CREATE TABLE IF NOT EXISTS agent_run_phases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
                phase_order INTEGER NOT NULL,
                goal TEXT NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                result TEXT,
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(run_id, phase_order)
            );
        `;
        console.log("Table 'agent_run_phases' created or already exists.", agentRunPhasesTable.command);

        const agentRunStepsTable = await sql`
            CREATE TABLE IF NOT EXISTS agent_run_steps (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
                phase_id UUID REFERENCES agent_run_phases(id) ON DELETE CASCADE,
                step_order INTEGER NOT NULL,
                thought TEXT,
                action_type VARCHAR(50) NOT NULL,
                action_input JSONB,
                observation TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'agent_run_steps' updated or already exists.", agentRunStepsTable.command);

        // Ensure new column exists for existing deployments
        try {
            await sql`ALTER TABLE agent_run_steps ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES agent_run_phases(id) ON DELETE CASCADE;`;
        } catch (e) {
            if (!e.message.includes('column "phase_id" of relation "agent_run_steps" already exists')) {
                 console.warn(`Could not add phase_id column automatically: ${e.message}`);
            }
        }
        console.log("Agent run steps table columns checked.");

        const subsystemsTable = await sql`
            CREATE TABLE IF NOT EXISTS subsystems (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                progress INTEGER NOT NULL DEFAULT 0,
                "healthScore" VARCHAR(10) NOT NULL,
                dependencies JSONB,
                resources JSONB,
                milestones JSONB,
                "githubStats" JSONB,
                tasks JSONB,
                order_index INTEGER
            );
        `;
        console.log("Table 'subsystems' created or already exists.", subsystemsTable.command);

        const tasksTable = await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                description TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                due_date TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'tasks' created or already exists.", tasksTable.command);

        const dataSourcesTable = await sql`
            CREATE TABLE IF NOT EXISTS data_sources (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL UNIQUE,
                provider VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
                config_json JSONB,
                stats_json JSONB,
                last_successful_connection TIMESTAMP WITH TIME ZONE,
                last_error TEXT,
                is_enabled BOOLEAN DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table 'data_sources' created or already exists.", dataSourcesTable.command);


        // Insert default settings if they don't exist
        await sql`
            INSERT INTO settings (key, value)
            VALUES 
                ('defaultModelConfig', '{"model": "gemini-2.5-flash", "temperature": 0.7, "topP": 0.95}'),
                ('defaultAgentConfig', '{"systemPrompt": "You are a helpful AI assistant.", "useSemanticMemory": true, "useStructuredMemory": true}'),
                ('enableDebugLog', '{"enabled": false}'),
                ('featureFlags', '{"enableMemoryExtraction": true, "enableProactiveSuggestions": true, "enableAutoSummarization": true}'),
                ('global_ui_settings', '{"fontSize": "base", "messageFontSize": "sm"}')
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `;
        console.log("Default settings inserted or already exist.");


        console.log("All tables checked/created successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

createTables();
