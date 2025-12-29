
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.22',
        releaseDate: new Date().toISOString(),
        changes: `
### 🚀 Final Architecture Lock (v0.5.22)

**Critical Fixes:**
- **Atomic Database Seeding:** Rewrote the admin seed route to use a single transactional client, ensuring version updates are strictly persisted.
- **Memory Tier Integration:** All memory modules (Postgres, Pinecone, KV) are now fully aligned with the v2.0 Architecture.
- **Extraction Strategy:** Confirmed implementation of 'Single-Shot' vs 'Background' modes in the Core Engine.
`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        // Clear old history to match the strict behavior of the API route
        await sql`DELETE FROM "version_history"`;

        for (const version of versionData) {
            await sql`
                INSERT INTO "version_history" ("version", "releaseDate", "changes")
                VALUES (${version.version}, ${version.releaseDate}, ${version.changes})
                ON CONFLICT ("version") DO UPDATE SET
                    "releaseDate" = EXCLUDED."releaseDate",
                    "changes" = EXCLUDED."changes";
        `;
        }
        console.log(`Successfully seeded version ${versionData[0].version}.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
