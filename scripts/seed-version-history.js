
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.45',
        releaseDate: new Date().toISOString(),
        changes: `### 🛠️ Stability Patch (v0.5.45)

**Bug Fixes:**
- **Projects Hub Crash:** Fixed a critical client-side crash caused by the task list renderer expecting an array but receiving a different type during error states. Added strict type guards in the UI rendering loop.
- **Tools API Error:** Fixed a 500 Internal Server Error in the Tools API endpoints caused by a case-sensitivity mismatch in the SQL column name ('schemaJson').

**Improvements:**
- **Robustness:** Enhanced error handling in the Projects data fetching logic.`
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
