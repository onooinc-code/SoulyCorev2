
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.27',
        releaseDate: new Date().toISOString(),
        changes: `### 📱 Mobile UI Resilience Overhaul (v0.5.27)

**Major Structural Fixes:**
- **Floating Input Fix:** Resolved "Half-Hidden" input issue by refining Dynamic Viewport (dvh) constraints and removing conflicting fixed positioning.
- **Compact Action Bar:** Toolbars now hide labels on mobile to prevent button overlap, using clear icons and semantic colors.
- **Layout Sandwich:** Fixed the "Missing Footer" bug by enforcing strict flex-shrink-0 rules on the action bar and status bar.
- **Text Interaction Guard:** Implemented global min-width constraints to prevent UI expansion during text selection.
- **Safe Area Padding:** Added iOS home indicator support (safe-bottom) to all persistent footer elements.`
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
