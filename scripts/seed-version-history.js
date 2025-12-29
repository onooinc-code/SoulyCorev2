
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.15',
        releaseDate: new Date().toISOString(), // NOW
        changes: `
### 🔧 Critical Fixes & Sync (v0.5.15)

**System Repairs:**
- **Report Visibility:** Fixed a bug where named reports (like the System Audit) were hidden from the Reports Hub.
- **Version Sync:** Forced synchronization of version history across the Header and Change Log modal.

**Documentation:**
- **Codebase Explained:** Added comprehensive technical documentation covering the entire system architecture.
`
    },
    {
        version: '0.5.14',
        releaseDate: new Date(Date.now() - 3600000).toISOString(),
        changes: `
### 📚 Documentation & Reference (v0.5.14)

**New Resources:**
- **Codebase Encyclopedia:** Added \`CODE_EXPLAINED.md\`, a complete technical reference manual explaining every directory, core module, and data flow in the system.
`
    },
    {
        version: '0.5.13',
        releaseDate: new Date(Date.now() - 7200000).toISOString(),
        changes: `
### 🔍 System Audit & Versioning Fix (v0.5.13)

**Critical Repairs:**
- **Report Viewer:** Fixed a logic error where named reports (e.g., System Audit) were ignored by the viewer. Now sorts by file date.
- **Versioning Sync:** Resolved data discrepancy.
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
