
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.14',
        releaseDate: new Date().toISOString(), // Today
        changes: `
### 📚 Documentation & Reference (v0.5.14)

**New Resources:**
- **Codebase Encyclopedia:** Added \`CODE_EXPLAINED.md\`, a complete technical reference manual explaining every directory, core module, and data flow in the system.

**System Updates:**
- **Documentation Sync:** Updated internal references to ensure the AI assistant is aware of the new documentation structure.
`
    },
    {
        version: '0.5.13',
        releaseDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        changes: `
### 🔍 System Audit & Versioning Fix (v0.5.13)

**Critical Repairs:**
- **Report Viewer:** Fixed a logic error where named reports (e.g., System Audit) were ignored by the viewer. Now sorts by file date.
- **Versioning Sync:** Resolved data discrepancy. The system now enforces strict date-based sorting to fetch the true latest version from the database.

**Reports:**
- **System Audit:** Generated a comprehensive audit report covering active features, bugs, and mobile UX analysis.
`
    },
    {
        version: '0.5.12',
        releaseDate: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        changes: `
### 🛠️ Stability & Live Sync Patch (v0.5.12)

**Critical Bug Fixes:**
- **Extraction Pipeline Auth:** Fixed a critical 'API_KEY_INVALID' error in the background memory extraction process.
- **Chat UI Sync:** Fixed an issue where new messages and AI responses wouldn't appear immediately.
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
