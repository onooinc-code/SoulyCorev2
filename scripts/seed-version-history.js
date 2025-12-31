
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.28',
        releaseDate: new Date().toISOString(),
        changes: `### 🛠️ Toolbar Restoration & Stability (v0.5.28)

**Major Layout Improvements:**
- **Toolbar Recall:** Restored the Macro and Formatting bars to permanent visibility as per user request.
- **Horizontal Scroll Protection:** Prevented layout breakage by using horizontal scrolling for tools, ensuring the input area remains compact vertically.
- **Mobile Label Optimization:** Toolbars automatically switch to icon-only mode on mobile to prevent overlapping.
- **RTL Support:** Refined toolbar alignment and labels for Arabic users.`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        await sql`DELETE FROM "version_history"`;
        for (const version of versionData) {
            await sql`
                INSERT INTO "version_history" ("version", "releaseDate", "changes")
                VALUES (${version.version}, ${version.releaseDate}, ${version.changes});
        `;
        }
        console.log(`Successfully seeded version ${versionData[0].version}.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
