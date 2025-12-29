
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.12',
        releaseDate: new Date().toISOString(), // Today (Latest)
        changes: `
### 🛠️ Stability & Live Sync Patch (v0.5.12)

**Critical Bug Fixes:**
- **Extraction Pipeline Auth:** Fixed a critical 'API_KEY_INVALID' error in the background memory extraction process.
- **Chat UI Sync:** Fixed an issue where new messages and AI responses wouldn't appear immediately.
- **Dynamic Versioning:** The system now automatically detects and displays the latest version from the database history.

**System Observability:**
- **Live Log Polling:** The System Output panel now auto-refreshes every 2 seconds.
`
    },
    {
        version: '0.5.11',
        releaseDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        changes: `
### 🚀 UX & Traceability Upgrade (v0.5.11)

**Core Experience:**
- **Auto-Navigation:** Creating a new chat now automatically switches focus to it.
- **Smart Auto-Titling:** New conversations start as "محادثة جديدة" and automatically generate a descriptive title.

**System Observability:**
- **Deep Trace Links:** System logs in the Dashboard and Log Panel are now clickable.
`
    },
    {
        version: '0.5.10',
        releaseDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        changes: `
### 🛠️ Robust Auth Strategy (v0.5.10)

**Critical Fixes:**
- **Smart Key Selection:** Intelligent API Key selection logic.
- **Enhanced Sanitization:** Hardened logic to strip surrounding quotes.
`
    },
    {
        version: '0.4.16',
        releaseDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        changes: `
### 🕵️ Memory Transparency (v0.4.16)

**New Cognitive Features:**
- **Extracted Badge:** AI message footer now shows harvested facts.
- **Deep-Step Logging:** Granular logging for internal pipeline steps.
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
