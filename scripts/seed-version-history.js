
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.2',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ UX Refinement & Agent Setup (v0.5.2)

**Navigation Upgrade:**
- **Agent Config Button:** Moved the Agent Setup button to the **Sidebar Toolbar** for permanent visibility. You no longer need to be in an active chat to find it.
- **Global Context:** Agent configuration state is now global, allowing access from any view.

**System Stability:**
- **Version Sync:** Fixed discrepancy between reported version and internal build number.
- **Cleanup:** Refactored modal handling to reduce code duplication between Chat and Global scopes.

**Features:**
- **Sidebar Shortcuts:** Added quick access to Data Hub and Agent Setup directly from the sidebar footer.
`
    },
    {
        version: '0.4.16',
        releaseDate: '2025-12-23T14:00:00Z',
        changes: `
### 🕵️ Memory Transparency & Deep Logging (v0.4.16)

**New Cognitive Features:**
- **Extracted Badge:** Every AI message now has a "Extracted" badge in the footer. Click it to see exactly what facts, entities, and preferences were harvested from that turn.
- **Deep-Step Logging:** Added granular logging for every internal pipeline step. You can now see the detailed "Behind the Scenes" of memory extraction in the Debug Log panel.
- **Unified Inspector:** The Cognitive Inspector now displays both "Context Retrieval" (What I read) and "Memory Extraction" (What I learned).

**Bug Fixes:**
- **Pipeline Visibility:** Fixed an issue where background extraction results were hidden from the user.
`
    },
    {
        version: '0.4.15',
        releaseDate: '2025-12-22T14:00:00Z',
        changes: `
### 🧠 Cognitive Identity Sync (v0.4.15)
- Automated background memory extraction for identity sync.
- Enhanced Arabic support for extracting names, roles, and preferences.
- Fixed duplicate messages bug in short-term memory assembly.
`
    },
    {
        version: '0.4.14',
        releaseDate: '2025-12-21T12:00:00Z',
        changes: `
### 📏 Scrolling & UI Integrity (v0.4.14)
- Fixed critical scrolling issue in the message list.
- Improved scrollbar visibility and layout stability.
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
