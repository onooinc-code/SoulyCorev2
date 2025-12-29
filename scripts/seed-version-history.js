
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.18',
        releaseDate: new Date().toISOString(),
        changes: `
### 🚨 Auto-Repair (v0.5.18)

**System Recovery:**
- **Full DB Re-Init:** The Force Update button now rebuilds the entire database schema to fix missing tables (Agent Runs, Logs, etc.) on Vercel.
- **Self-Healing:** Automatically applied schema fixes.
`
    },
    {
        version: '0.5.17',
        releaseDate: new Date(Date.now() - 1000000).toISOString(),
        changes: `
### 🛠️ UI Utilities (v0.5.17)

**New Features:**
- **Force Update Button:** Added a manual trigger in the Header to re-seed the database and sync versions on Vercel without CLI access.
`
    },
    {
        version: '0.5.16',
        releaseDate: new Date(Date.now() - 2000000).toISOString(),
        changes: `
### 🚀 Vercel & Memory Core Fix (v0.5.16)

**System Updates:**
- **Admin Seeder:** Added web-based seeding tool at \`/api/admin/seed\` to fix database updates on Vercel.
- **UI Sync:** Fixed chat response lag by removing reliance on immediate read-after-write fetches.
- **Deep Context:** Enhanced entity lookup to use conversation history, fixing pronoun resolution ("Where does *he* work?").
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
