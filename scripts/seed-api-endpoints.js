// scripts/seed-api-endpoints.js
const { sql } = require('@vercel/postgres');

const endpoints = [
  // Bookmarks
  { method: 'GET', path: '/api/bookmarks', group_name: 'bookmarks', description: 'Get all bookmarked messages.' },
  // Brains
  { method: 'GET', path: '/api/brains', group_name: 'brains', description: 'Get all brain configurations.' },
  { method: 'POST', path: '/api/brains', group_name: 'brains', description: 'Create a new brain.', default_body_json: { name: "Test Brain", config_json: { "module": "default" } } },
  // Chat
  { method: 'POST', path: '/api/chat', group_name: 'chat', description: 'Main endpoint to generate an AI response.', default_body_json: { messages: [{role: 'user', content: 'hello'}], conversation: { id: 'some-uuid' } } },
  // Contacts
  { method: 'GET', path: '/api/contacts', group_name: 'contacts', description: 'Get all contacts.' },
  { method: 'POST', path: '/api/contacts', group_name: 'contacts', description: 'Create a new contact.', default_body_json: { name: "Test Contact", email: "test@example.com" } },
  // Conversations
  { method: 'GET', path: '/api/conversations', group_name: 'conversations', description: 'Get all conversations.' },
  { method: 'POST', path: '/api/conversations', group_name: 'conversations', description: 'Create a new conversation.', default_body_json: { title: "New Test Chat" } },
  // Entities
  { method: 'GET', path: '/api/entities', group_name: 'entities', description: 'Get all entities.' },
  { method: 'POST', path: '/api/entities', group_name: 'entities', description: 'Create a new entity.', default_body_json: { name: "Test Entity", type: "Test Type", details_json: "{}" } },
  // Features
  { method: 'GET', path: '/api/features', group_name: 'features', description: 'Get all features.' },
  { method: 'POST', path: '/api/features', group_name: 'features', description: 'Create a new feature.', default_body_json: { name: "Test Feature", status: "⚪ Planned" } },
  // Inspect
  { method: 'GET', path: '/api/inspect/some-uuid', group_name: 'inspect', description: 'Get pipeline run details for a message.' },
  // Knowledge
  { method: 'POST', path: '/api/knowledge/add', group_name: 'knowledge', description: 'Add a new knowledge snippet.', default_body_json: { content: "This is a test knowledge snippet." } },
  // Logs
  { method: 'GET', path: '/api/logs/all', group_name: 'logs', description: 'Get all logs.' },
  { method: 'DELETE', path: '/api/logs/all', group_name: 'logs', description: 'Delete all logs.', expected_status_code: 200 },
  { method: 'POST', path: '/api/logs/create', group_name: 'logs', description: 'Create a new log entry.', default_body_json: { message: "Test log", level: "info" } },
  // Memory
  { method: 'POST', path: '/api/memory/pipeline', group_name: 'memory', description: 'Trigger the memory extraction pipeline.', default_body_json: { textToAnalyze: "User and AI conversation." } },
  // Prompts
  { method: 'GET', path: '/api/prompts', group_name: 'prompts', description: 'Get all prompts.' },
  { method: 'POST', path: '/api/prompts', group_name: 'prompts', description: 'Create a new prompt.', default_body_json: { name: "Test Prompt", content: "This is a test." } },
  { method: 'POST', path: '/api/prompts/execute-chain', group_name: 'prompts', description: 'Execute a prompt chain.', default_body_json: { promptId: "some-uuid", userInputs: {} } },
  // Settings
  { method: 'GET', path: '/api/settings', group_name: 'settings', description: 'Get all application settings.' },
  { method: 'PUT', path: '/api/settings', group_name: 'settings', description: 'Update application settings.', default_body_json: { "enableDebugLog": { "enabled": true } } },
  // Summarize
  { method: 'POST', path: '/api/summarize', group_name: 'summarize', description: 'Summarize a block of text.', default_body_json: { text: "This is a long text to summarize." } },
  // Tests
  { method: 'GET', path: '/api/tests', group_name: 'tests', description: 'Get all feature test cases.' },
];

async function seedApiEndpoints() {
    console.log("Seeding API endpoints...");
    try {
        for (const endpoint of endpoints) {
            await sql`
                INSERT INTO "api_endpoints" (
                    "method", 
                    "path", 
                    "groupName", 
                    "description", 
                    "defaultBodyJson",
                    "expectedStatusCode"
                )
                VALUES (
                    ${endpoint.method}, 
                    ${endpoint.path}, 
                    ${endpoint.group_name}, 
                    ${endpoint.description || null},
                    ${endpoint.default_body_json ? JSON.stringify(endpoint.default_body_json) : null},
                    ${endpoint.expected_status_code || 200}
                )
                ON CONFLICT ("path") DO NOTHING;
            `;
        }
        console.log(`Seeded or verified ${endpoints.length} API endpoints.`);
    } catch (error) {
        console.error("Error seeding API endpoints:", error);
        process.exit(1);
    }
}

seedApiEndpoints();