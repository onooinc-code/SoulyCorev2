
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.26',
        releaseDate: new Date().toISOString(),
        changes: `### 📱 Mobile UI Overhaul (v0.5.26)

**Critical Fixes:**
- **Dynamic Viewport Height:** Full transition to \`100dvh\` to ensure the footer and input field never hide behind mobile browser bars.
- **Scrollable Toolbars:** Redesigned macro and formatting toolbars as single-line horizontal scrollable areas to prevent overlap and clashing.
- **Selection Width Protection:** Applied global \`min-width: 0\` and Flexbox constraints to prevent layout breakage during text selection.
- **Cleaner Mobile Typing:** Toolbars are now hidden by default on mobile, with a toggle button to expand them when needed.
- **Responsive Status Bar:** Simplified the status bar for small screens, showing only core metrics.`
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
