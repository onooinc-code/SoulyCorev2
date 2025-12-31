
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.24',
        releaseDate: new Date().toISOString(),
        changes: `### 📱 Critical Mobile Layout Fixes (v0.5.24)

**UI/UX Stability:**
- **Dynamic Viewport Height:** Implemented `h-[100dvh]` to prevent footer being hidden by mobile browser toolbars.
- **Selection Width Fix:** Added `min-w-0` and constrained overflow on input container to prevent layout breakage during text selection.
- **Enhanced Footer Stability:** Fixed footer positioning using `flex-shrink-0` ensuring controls are always reachable.
- **Input Refinement:** Adjusted internal padding and max-height for better visibility on small 6-inch screens.`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        // Clear old history to match the strict behavior of the API route
        await sql`DELETE FROM "version_history"`;

        for (const version of versionData) {
            await sql`
                INSERT INTO "version_history" ("version", "releaseDate", "changes")
                VALUES (${version.version}, ${version.releaseDate}, ${version.changes})
                ON CONFLICT ("version") DO UPDATE SET
                    "releaseDate" = EXCLUDED."releaseDate",
                    "changes" = EXCLUDED."changes";
        `;
        }
        console.log(`Successfully seeded version ${versionData[0].version}.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
