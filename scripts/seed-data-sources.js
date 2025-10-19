// scripts/seed-data-sources.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

const dataSources = [
    { name: 'Vercel Postgres', provider: 'Vercel', type: 'relational_db', status: 'connected', stats: [{ label: 'Tables', value: 25 }, { label: 'Latency', value: '55ms' }] },
    { name: 'Pinecone KnowledgeBase', provider: 'Pinecone', type: 'vector', status: 'connected', stats: [{ label: 'Vectors', value: '1.2M' }, { label: 'Latency', value: '120ms' }] },
    { name: 'Vercel KV', provider: 'Vercel', type: 'key_value', status: 'connected', stats: [{ label: 'Keys', value: 4096 }, { label: 'Latency', value: '30ms' }] },
    { name: 'Upstash Vector', provider: 'Upstash', type: 'vector', status: 'needs_config', stats: [{ label: 'Vectors', value: 0 }, { label: 'Latency', value: 'N/A' }] },
    { name: 'Vercel GraphDB', provider: 'Vercel', type: 'graph', status: 'needs_config', stats: [{ label: 'Nodes', value: 0 }, { label: 'Latency', value: 'N/A' }] },
    { name: 'Vercel MongoDB', provider: 'Vercel', type: 'document_db', status: 'needs_config', stats: [{ label: 'Collections', value: 0 }, { label: 'Latency', value: 'N/A' }] },
    { name: 'Vercel Redis', provider: 'Vercel', type: 'cache', status: 'disconnected', stats: [{ label: 'Keys', value: 0 }, { label: 'Latency', value: 'N/A' }] },
    { name: 'Vercel Blob', provider: 'Vercel', type: 'blob', status: 'needs_config', stats: [{ label: 'Files', value: 0 }, { label: 'Size', value: '0MB' }] },
    { name: 'Google Drive', provider: 'Google', type: 'file_system', status: 'disconnected', stats: [{ label: 'Files', value: 'N/A' }, { label: 'Auth', value: 'OAuth' }] },
    { name: 'Self-Hosted MySQL', provider: 'Self-Hosted', type: 'relational_db', status: 'error', stats: [{ label: 'Status', value: 'Failed' }, { label: 'Latency', value: 'N/A' }] },
    { name: 'Supabase', provider: 'Supabase', type: 'relational_db', status: 'unstable', stats: [{ label: 'Tables', value: 15 }, { label: 'Latency', value: '250ms' }] },
];

async function seedDataSources() {
    console.log("Seeding data sources...");
    try {
        for (const source of dataSources) {
            await sql`
                INSERT INTO data_sources (
                    name, provider, type, status, stats_json, "lastUpdatedAt"
                ) VALUES (
                    ${source.name}, ${source.provider}, ${source.type}, ${source.status},
                    ${JSON.stringify(source.stats)}, CURRENT_TIMESTAMP
                )
                ON CONFLICT (name) DO UPDATE SET
                    provider = EXCLUDED.provider,
                    type = EXCLUDED.type,
                    status = EXCLUDED.status,
                    stats_json = EXCLUDED.stats_json,
                    "lastUpdatedAt" = CURRENT_TIMESTAMP;
            `;
        }
        console.log(`Successfully seeded ${dataSources.length} data sources.`);
    } catch (error) {
        console.error("Error seeding data_sources table:", error);
        process.exit(1);
    }
}

seedDataSources();