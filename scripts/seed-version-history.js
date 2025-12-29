
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.21',
        releaseDate: new Date().toISOString(),
        changes: `
### 🧠 Advanced Memory Control (v0.5.21)

**New Features:**
- **Extraction Strategy Selector:** Users can now choose between "Single-Shot" (Fast/Efficient) and "Background" (High Accuracy) memory extraction modes.
- **Configurable Models:** The model used for background extraction can be customized (e.g., use Pro for complex analysis, Flash for speed).
- **Granular Control:** Settings can be defined globally and overridden per conversation in the Agent Setup menu.
`
    },
    {
        version: '0.5.20',
        releaseDate: new Date(Date.now() - 3600000).toISOString(),
        changes: `
### ⚡ Major Optimization: Single-Shot Architecture (v0.5.20)

**Core Engine:**
- **Dual-Output Logic:** The AI now generates the chat response AND extracts memory in a single API call.
- **Quota Saver:** Reduced API usage by 50%, virtually eliminating "429 Rate Limit" errors.
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
