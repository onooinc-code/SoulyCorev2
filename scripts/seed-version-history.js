
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.44',
        releaseDate: new Date().toISOString(),
        changes: `### 🧠 Project Knowledge Injection (v0.5.44)

**New Features:**
- **Project Technical Context:** Added a dedicated module to inject Business Logic, DB Schemas, and Code Snippets directly into a project's memory.
- **Context Modal:** A new UI in Projects Hub to paste and categorize technical data.
- **Smart Ingestion:** The system now automatically routes project context to both Semantic Memory (for RAG) and Document Memory (for Archival).

**Improvements:**
- **Projects Hub:** Updated UI to include the new "Technical Context" action.
- **Versioning:** Bumped system version to v0.5.44.`
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
