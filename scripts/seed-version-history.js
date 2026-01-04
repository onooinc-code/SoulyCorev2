
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.43',
        releaseDate: new Date().toISOString(),
        changes: `### 🧠 Cognitive & Observability Enhancement (v0.5.43)

**Core Fixes:**
- **Full Observability:** Implemented granular logging for all Context Assembly and Memory Extraction steps directly to the central \`logs\` table, visible in the Dev Center.
- **Memory Monitors:** Fixed the 4 Memory Monitor indicators in the Status Bar to react in real-time to the API's returned metadata (Context retrieval stats).
- **Log Panel:** Added "Copy Errors", "Copy Logs", and "Download JSON" buttons for better debugging.
- **Extraction UI:** Refined the "Extracted" button logic to correctly locate the background extraction run even if it completes after the initial response.

**Improvements:**
- **Unified Logging:** Frontend and Backend logs now flow into a single stream.
- **Stability:** Hardened JSON parsing logic in pipeline outputs.`
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
