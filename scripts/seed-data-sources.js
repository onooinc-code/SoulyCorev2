// scripts/seed-data-sources.js
const { sql } = require('@vercel/postgres');

const dataSources = [
    // Connected and active data sources
    { 
        name: 'Vercel Postgres', 
        provider: 'Vercel', 
        type: 'relational_db', 
        status: 'connected', 
        stats: [{ label: 'Tables', value: 25 }, { label: 'Latency', value: '55ms' }] 
    },
    { 
        name: 'Pinecone KnowledgeBase', 
        provider: 'Pinecone', 
        type: 'vector', 
        status: 'connected', 
        stats: [{ label: 'Vectors', value: '1.2M' }, { label: 'Latency', value: '120ms' }] 
    },
    { 
        name: 'Upstash Vector', 
        provider: 'Upstash', 
        type: 'vector', 
        status: 'connected', 
        stats: [{ label: 'Vectors', value: '250k' }, { label: 'Latency', value: '45ms' }] 
    },
    { 
        name: 'Vercel KV', 
        provider: 'Vercel', 
        type: 'key_value', 
        status: 'connected', 
        stats: [{ label: 'Keys', value: 4096 }, { label: 'Latency', value: '30ms' }] 
    },
    { 
        name: 'Vercel Blob', 
        provider: 'Vercel', 
        type: 'blob', 
        status: 'connected', 
        stats: [{ label: 'Files', value: 128 }, { label: 'Size', value: '2.3GB' }] 
    },
    { 
        name: 'Vercel MongoDB', // Represents the MongoDB Atlas integration
        provider: 'Vercel', 
        type: 'document_db', 
        status: 'connected', 
        stats: [{ label: 'Docs', value: '8.1M' }, { label: 'Size', value: '12.5GB' }] 
    },
    { 
        name: 'Vercel Redis', // Represents the Vercel KV (Redis-compatible) connection
        provider: 'Vercel', 
        type: 'cache', 
        status: 'connected', 
        stats: [{ label: 'Keys', value: 4096 }, { label: 'Latency', value: '30ms' }] 
    },
    { 
        name: 'Vercel GraphDB', // Represents the EdgeDB integration
        provider: 'Vercel', 
        type: 'graph', 
        status: 'connected', 
        stats: [{ label: 'Objects', value: 1572 }, { label: 'Latency', value: '80ms' }] 
    },
    
    // Mocked / Not-yet-configured sources
    { 
        name: 'Google Drive', 
        provider: 'Google', 
        type: 'file_system', 
        status: 'needs_config', 
        stats: [] 
    },
    { 
        name: 'Self-Hosted MySQL', 
        provider: 'Self-Hosted', 
        type: 'relational_db', 
        status: 'needs_config', 
        stats: [] 
    },
    { 
        name: 'Supabase', 
        provider: 'Supabase', 
        type: 'relational_db', 
        status: 'needs_config', 
        stats: [] 
    },
];

async function seedDataSources() {
    console.log("Seeding data sources...");
    try {
        // Clear old entries that might no longer exist
        const existingSourceNames = dataSources.map(s => `'${s.name.replace(/'/g, "''")}'`).join(', ');
        await sql.query(`DELETE FROM data_sources WHERE name NOT IN (${existingSourceNames});`);

        for (const source of dataSources) {
            await sql`
                INSERT INTO data_sources (
                    name, provider, type, status, "statsJson", "lastUpdatedAt"
                ) VALUES (
                    ${source.name}, ${source.provider}, ${source.type}, ${source.status},
                    ${JSON.stringify(source.stats)}, CURRENT_TIMESTAMP
                )
                ON CONFLICT (name) DO UPDATE SET
                    provider = EXCLUDED.provider,
                    type = EXCLUDED.type,
                    status = EXCLUDED.status,
                    "statsJson" = EXCLUDED."statsJson",
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