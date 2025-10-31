// scripts/seed-api-endpoints.js
const { sql } = require('@vercel/postgres');

const endpoints = [
  // Bookmarks
  { method: 'GET', path: '/api/bookmarks', groupName: 'bookmarks', description: 'Get all bookmarked messages.' },
  // Brains
  { method: 'GET', path: '/api/brains', groupName: 'brains', description: 'Get all brain configurations.' },
  { method: 'POST', path: '/api/brains', groupName: 'brains', description: 'Create a new brain.', defaultBodyJson: { name: "Test Brain", configJson: { "module": "default" } } },
  // Chat
  { method: 'POST', path: '/api/chat', groupName: 'chat', description: 'Main endpoint to generate an AI response.', defaultBodyJson: { messages: [{role: 'user', content: 'hello'}], conversation: { id: 'some-uuid' } } },
  // Contacts
  { method: 'GET', path: '/api/contacts', groupName: 'contacts', description: 'Get all contacts.' },
  { method: 'POST', path: '/api/contacts', groupName: 'contacts', description: 'Create a new contact.', defaultBodyJson: { name: "Test Contact", email: "test@example.com" } },
  // Conversations
  { method: 'GET', path: '/api/conversations', groupName: 'conversations', description: 'Get all conversations.' },
  { method: 'POST', path: '/api/conversations', groupName: 'conversations', description: 'Create a new conversation.', defaultBodyJson: { title: "New Test Chat" } },
  // Entities
  { method: 'GET', path: '/api/entities', groupName: 'entities', description: 'Get all entities.' },
  { method: 'POST', path: '/api/entities', groupName: 'entities', description: 'Create a new entity.', defaultBodyJson: { name: "Test Entity", type: "Test Type", detailsJson: "{}" } },
  // Features
  { method: 'GET', path: '/api/features', groupName: 'features', description: 'Get all features.' },
  { method: 'POST', path: '/api/features', groupName: 'features', description: 'Create a new feature.', defaultBodyJson: { name: "Test Feature", status: "⚪ Planned" } },
  // Inspect
  { method: 'GET', path: '/api/inspect/some-uuid', groupName: 'inspect', description: 'Get pipeline run details for a message.' },
  // Knowledge
  { method: 'POST', path: '/api/knowledge/add', groupName: 'knowledge', description: 'Add a new knowledge snippet.', defaultBodyJson: { content: "This is a test knowledge snippet." } },
  // Logs
  { method: 'GET', path: '/api/logs/all', groupName: 'logs', description: 'Get all logs.' },
  { method: 'DELETE', path: '/api/logs/all', groupName: 'logs', description: 'Delete all logs.', expectedStatusCode: 200 },
  { method: 'POST', path: '/api/logs/create', groupName: 'logs', description: 'Create a new log entry.', defaultBodyJson: { message: "Test log", level: "info" } },
  // Memory
  { method: 'POST', path: '/api/memory/pipeline', groupName: 'memory', description: 'Trigger the memory extraction pipeline.', defaultBodyJson: { textToAnalyze: "User and AI conversation." } },
  // Prompts
  { method: 'GET', path: '/api/prompts', groupName: 'prompts', description: 'Get all prompts.' },
  { method: 'POST', path: '/api/prompts', groupName: 'prompts', description: 'Create a new prompt.', defaultBodyJson: { name: "Test Prompt", content: "This is a test." } },
  { method: 'POST', path: '/api/prompts/execute-chain', groupName: 'prompts', description: 'Execute a prompt chain.', defaultBodyJson: { promptId: "some-uuid", userInputs: {} } },
  // Settings
  { method: 'GET', path: '/api/settings', groupName: 'settings', description: 'Get all application settings.' },
  { method: 'PUT', path: '/api/settings', groupName: 'settings', description: 'Update application settings.', defaultBodyJson: { "enableDebugLog": { "enabled": true } } },
  // Summarize
  { method: 'POST', path: '/api/summarize', groupName: 'summarize', description: 'Summarize a block of text.', defaultBodyJson: { text: "This is a long text to summarize." } },
  // Tests
  { method: 'GET', path: '/api/tests', groupName: 'tests', description: 'Get all feature test cases.' },
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
                    ${endpoint.groupName}, 
                    ${endpoint.description || null},
                    ${endpoint.defaultBodyJson ? JSON.stringify(endpoint.defaultBodyJson) : null},
                    ${endpoint.expectedStatusCode || 200}
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