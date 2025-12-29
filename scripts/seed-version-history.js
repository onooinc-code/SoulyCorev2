
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.23',
        releaseDate: new Date().toISOString(),
        changes: `### 📱 Mobile Experience Overhaul (v0.5.23)

**UI/UX Improvements:**
- **Collapsible Toolbars:** Added a toggle to hide/show chat toolbars, maximizing screen real estate on small devices.
- **Horizontal Scrolling:** Converted macro and formatting toolbars to swipeable lists to prevent button crowding.
- **Touch Optimization:** Increased touch targets and adjusted spacing for better usability on touch screens.
- **Visual Polish:** Improved backdrop blur and input container styling for a modern feel.`
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
