
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.42',
        releaseDate: new Date().toISOString(),
        changes: `### 🧠 Cognitive Engine Stabilization (v0.5.42)

**Core Fixes:**
- **Cognitive Inspector:** Fixed the blank "Context Viewer" modals. The \`ContextAssemblyPipeline\` now explicitly saves \`finalLlmPrompt\`, \`finalSystemInstruction\`, and \`modelConfigJson\` to the database upon completion.
- **Memory Extraction UI:** Resolved the persistent "Extraction data still processing" message. The UI now intelligently searches for the specific \`MemoryExtraction\` pipeline run instead of assuming the first run is the extraction.
- **Pipeline Logging:** Enhanced visibility by ensuring strictly typed pipeline runs for 'ContextAssembly' vs 'MemoryExtraction' are correctly queryable.

**UI Improvements:**
- **Visual Clarity:** Updated Message bubbles for better RTL support and distinct User/AI visual separation.`
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
