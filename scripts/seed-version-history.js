
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.4.13',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ Persistence & Build Integrity (v0.4.13)

**Architecture Fixes:**
- **Zero Data Loss:** Modified database initialization to use \`IF NOT EXISTS\` without dropping tables. Your data now persists across deployments.
- **Vercel Build Stability:** Fixed critical TypeScript type errors in processing pipelines that were causing deployment failures.

**UI Restorations:**
- **Debug Log Access:** Added a dedicated "Logs" toggle button in the chat status bar for instant access to the developer console.
- **Improved Type Safety:** Hardened pipelines against empty AI responses.
`
    },
    {
        version: '0.4.12',
        releaseDate: new Date('2024-07-30T10:00:00Z'),
        changes: `
### 📐 Symmetric Interface Update (v0.4.12)
- **Symmetric Toolbars:** Both toolbars now have exactly 12 buttons.
- **Curated Actions:** Reduced top toolbar actions to the most essential items.
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
