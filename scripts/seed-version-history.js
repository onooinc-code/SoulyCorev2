
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.25',
        releaseDate: new Date().toISOString(),
        changes: `### 📱 Mobile UI Resilience Update (v0.5.25)

**Major Fixes:**
- **The "Width-Break" Solution:** Implemented \`min-w-0\` and explicit \`max-w-full\` constraints on the chat input flex components. This prevents the entire UI from breaking during text selection on mobile browsers.
- **Stable Layout:** Switched to \`fixed\` positioning for body and \`100dvh\` for the chat container to ensure the footer and input never hide behind browser toolbars.
- **Touch Optimization:** Enhanced touch targets for primary action buttons (Send, File, Toggles) and enabled native momentum scrolling on horizontal toolbars.
- **Clutter Reduction:** Reduced vertical internal padding of the input area for 6-inch screens to maximize the chat history viewport.`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
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
