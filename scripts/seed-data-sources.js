// scripts/seed-data-sources.js
const { sql } = require('@vercel/postgres');

const dataSources = [
    // Previously connected sources
    { name: 'Vercel Postgres', provider: 'Vercel', type: 'relational_db', status: 'connected', stats: [{ label: 'Tables', value: 25 }, { label: 'Latency', value: '55ms' }] },
    { name: 'Pinecone KnowledgeBase', provider: 'Pinecone', type: 'vector', status: 'connected', stats: [{ label: 'Vectors', value: '1.2M' }, { label: 'Latency', value: '120ms' }] },
    { name: 'Vercel KV', provider: 'Vercel', type: 'key_value', status: 'connected', stats: [{ label: 'Keys', value: 4096 }, { label: 'Latency', value: '30ms' }] },
    
    // Updated "mock" sources to be "connected" with realistic stats
    { name: 'Upstash Vector', provider: 'Upstash', type: 'vector', status: 'connected', stats: [{ label: 'Vectors', value: '250k' }, { label: 'Latency', value: '45ms' }] },
    { name: 'Vercel GraphDB', provider: 'Vercel', type: 'graph', status: 'connected', stats: [{ label: 'Nodes', value: '1.2M' }, { label: 'Edges', value: '5M' }] },
    { name: 'Vercel MongoDB', provider: 'Vercel', type: 'document_db', status: 'connected', stats: [{ label: 'Docs', value: '8.1M' }, { label: 'Latency', value: '80ms' }] },
    { name: 'Vercel Redis', provider: 'Vercel', type: 'cache', status: 'connected', stats: [{ label: 'Keys', value: '1.5k' }, { label: 'Latency', value: '15ms' }] },
    { name: 'Vercel Blob', provider: 'Vercel', type: 'blob', status: 'connected', stats: [{ label: 'Files', value: 128 }, { label: 'Size', value: '2.3GB' }] },
    { name: 'Google Drive', provider: 'Google', type: 'file_system', status: 'connected', stats: [{ label: 'Files', value: 432 }, { label: 'Auth', value: 'OAuth' }] },
    { name: 'Self-Hosted MySQL', provider: 'Self-Hosted', type: 'relational_db', status: 'connected', stats: [{ label: 'Tables', value: 58 }, { label: 'Latency', value: '95ms' }] },
    { name: 'Supabase', provider: 'Supabase', type: 'relational_db', status: 'connected', stats: [{ label: 'Tables', value: 33 }, { label: 'Latency', value: '70ms' }] },
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