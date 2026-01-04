
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.46',
        releaseDate: new Date().toISOString(),
        changes: `### 🛡️ Fault Tolerance Patch (v0.5.46)

**Fixes:**
- **Context Ingestion Hardening:** The API route for injecting project context (`/api/projects/.../context`) is now fault-tolerant. It wraps storage operations for Semantic (Pinecone), Document (MongoDB), and System (Postgres) memories in individual error handlers.
- **500 Error Prevention:** Prevents the entire "Save to Memory" operation from failing if a secondary storage service (like MongoDB) is disconnected or misconfigured. It will now save to available services and report warnings instead of crashing.

**Improvements:**
- **Granular Logging:** The system log now records exactly which storage tiers succeeded and which failed during ingestion.`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        await sql`DELETE FROM "version_history"`;
        for (const version of versionData) {
            await sql`
                INSERT INTO "version_history" ("version", "releaseDate", "changes")
                VALUES (${version.version}, ${version.releaseDate}, ${version.changes});
        `;
        }
        console.log(`Successfully seeded version ${versionData[0].version}.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
