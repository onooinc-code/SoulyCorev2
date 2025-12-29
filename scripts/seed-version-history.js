
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.19',
        releaseDate: new Date().toISOString(),
        changes: `
### ⚡ Performance & Quota Optimization (v0.5.19)

**Core Engine:**
- **Smart Extraction:** Memory extraction now skips short messages (<20 chars) to save AI quota.
- **Model Switching:** Background tasks now use \`gemini-2.5-flash\` for better rate limit management.
- **Error Handling:** "Rate Limit" errors are now caught gracefully, preventing UI crashes when Google API is busy.

**UI Updates:**
- **Refresh Fix:** Force Update button now bypasses cache to ensure immediate version reflection.
`
    },
    {
        version: '0.5.18',
        releaseDate: new Date(Date.now() - 3600000).toISOString(),
        changes: `
### 🚨 Auto-Repair (v0.5.18)

**System Recovery:**
- **Full DB Re-Init:** The Force Update button now rebuilds the entire database schema.
- **Self-Healing:** Automatically applied schema fixes.
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
