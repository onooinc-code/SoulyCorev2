
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.3',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛡️ Resilience Update (v0.5.3)

**System Stability:**
- **Monitor Recovery:** Fixed an issue where the Cognitive Monitors (Memory/Tools) would get stuck in a "Querying..." state if the main AI request failed. They now correctly report errors.
- **Error Handling:** Improved error reporting for API Key authentication failures.

**Bug Fixes:**
- **Version Sync:** Updated system version to reflect the latest hotfixes.
`
    },
    {
        version: '0.5.2',
        releaseDate: '2025-12-24T10:00:00Z',
        changes: `
### 🛠️ UX Refinement & Agent Setup (v0.5.2)

**Navigation Upgrade:**
- **Agent Config Button:** Moved the Agent Setup button to the **Sidebar Toolbar** for permanent visibility.
- **Global Context:** Agent configuration state is now global.

**System Stability:**
- **Version Sync:** Fixed discrepancy between reported version and internal build number.
`
    },
    {
        version: '0.4.16',
        releaseDate: '2025-12-23T14:00:00Z',
        changes: `
### 🕵️ Memory Transparency & Deep Logging (v0.4.16)

**New Cognitive Features:**
- **Extracted Badge:** AI message footer now shows harvested facts.
- **Deep-Step Logging:** Granular logging for internal pipeline steps.
- **Unified Inspector:** Enhanced Cognitive Inspector.
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
        console.log(`Successfully seeded ${versionData.length} version history entries.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
