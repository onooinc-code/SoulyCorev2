
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.47',
        releaseDate: new Date().toISOString(),
        changes: `### 🧠 Cognitive Assurance Patch (v0.5.47)

**New Features:**
- **Vector Memory Simulator:** Added a "Test Recall" tab to the Project Context modal.
  - Allows users to type a query and perform a live semantic search against the specific project's vector embeddings.
  - Displays matching text snippets and a visual "Similarity Score" bar to verify that memory ingestion was successful and accurate.

**Improvements:**
- **Context Workflow:** The system now automatically switches to the "Test Recall" tab after successfully ingesting new context, prompting the user to verify the memory immediately.`
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
