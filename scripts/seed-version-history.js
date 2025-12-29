
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.20',
        releaseDate: new Date().toISOString(),
        changes: `
### ⚡ Major Optimization: Single-Shot Architecture (v0.5.20)

**Core Engine:**
- **Dual-Output Logic:** The AI now generates the chat response AND extracts memory in a single API call.
- **Quota Saver:** Reduced API usage by 50%, virtually eliminating "429 Rate Limit" errors.
- **Zero Latency Learning:** Memory is extracted and saved instantly, without waiting for a background job.
- **JSON Enforcement:** The pipeline now strictly enforces structured output for machine-readable reliability.
`
    },
    {
        version: '0.5.19',
        releaseDate: new Date(Date.now() - 3600000).toISOString(),
        changes: `
### ⚡ Performance & Quota Optimization (v0.5.19)

**Core Engine:**
- **Smart Extraction:** Memory extraction now skips short messages (<20 chars) to save AI quota.
- **Model Switching:** Background tasks now use \`gemini-2.5-flash\`.
- **Error Handling:** Graceful handling of 429 Rate Limit errors.
`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        for (const version of versionData) {
            await sql`
                INSERT INTO "version_history" ("version", "releaseDate", "changes")
                VALUES (${version.version}, ${version.releaseDate}, ${version.changes})
                ON CONFLICT ("version") DO UPDATE SET
                    "releaseDate" = EXCLUDED."releaseDate",
                    "changes" = EXCLUDED."changes";
        `;
        }
        console.log(`Successfully seeded/updated ${versionData.length} version entries.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
