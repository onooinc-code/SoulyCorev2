// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.4.14',
        releaseDate: new Date().toISOString(),
        changes: `
### 📏 Scrolling & UI Integrity (v0.4.14)

**UI/UX Fixes:**
- **Scrollbar Restoration:** Fixed a critical CSS layout issue preventing message list scrolling.
- **Flexbox min-h-0:** Applied architectural flex fixes to ensure the chat window respects viewport bounds.
- **Improved Thumbnails:** Enhanced scrollbar visibility in Dark Mode.

**System:**
- **Version Sync:** Hardened versioning system to prevent mismatch between DB and code.
`
    },
    {
        version: '0.4.13',
        releaseDate: new Date('2024-07-31T12:00:00Z'),
        changes: `
### 🛠️ Persistence & Build Integrity (v0.4.13)
- Modified database initialization to use IF NOT EXISTS.
- Fixed critical TypeScript type errors.
- Added "Logs" toggle button in the chat status bar.
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