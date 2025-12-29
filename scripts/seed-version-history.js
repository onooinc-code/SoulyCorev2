
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.16',
        releaseDate: new Date().toISOString(),
        changes: `
### 🚀 Vercel & Memory Core Fix (v0.5.16)

**System Updates:**
- **Admin Seeder:** Added web-based seeding tool at \`/api/admin/seed\` to fix database updates on Vercel.
- **UI Sync:** Fixed chat response lag by removing reliance on immediate read-after-write fetches.
- **Deep Context:** Enhanced entity lookup to use conversation history, fixing pronoun resolution ("Where does *he* work?").
`
    },
    {
        version: '0.5.15',
        releaseDate: new Date(Date.now() - 3600000).toISOString(), 
        changes: `
### 🔧 Critical Fixes & Sync (v0.5.15)

**System Repairs:**
- **Report Visibility:** Fixed a bug where named reports (like the System Audit) were hidden from the Reports Hub.
- **Version Sync:** Forced synchronization of version history across the Header and Change Log modal.

**Documentation:**
- **Codebase Explained:** Added comprehensive technical documentation covering the entire system architecture.
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
