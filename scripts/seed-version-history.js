
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.13',
        releaseDate: new Date().toISOString(),
        changes: `
### 🔍 System Audit & Versioning Fix (v0.5.13)

**Critical Repairs:**
- **Versioning Sync:** Resolved a critical data discrepancy where the system displayed outdated versions (v0.5.2) instead of the active deployment. The system now enforces strict date-based sorting to fetch the true latest version.
- **Audit Generation:** Added a comprehensive system audit report (\`reports/ResponseTemplate-System-Audit.html\`) covering feature status, bugs, and mobile UX analysis.

**Documentation:**
- **Mobile UX Roadmap:** outlined specific UI issues on mobile devices (toolbar clutter) and proposed a "Compact Mode" solution.
`
    },
    {
        version: '0.5.12',
        releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        changes: `
### 🛠️ Stability & Live Sync Patch (v0.5.12)

**Critical Bug Fixes:**
- **Extraction Pipeline Auth:** Fixed a critical 'API_KEY_INVALID' error in the background memory extraction process.
- **Chat UI Sync:** Fixed an issue where new messages and AI responses wouldn't appear immediately.
- **Live Log Polling:** The System Output panel now auto-refreshes every 2 seconds.
`
    },
    {
        version: '0.5.11',
        releaseDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        changes: `
### 🚀 UX & Traceability Upgrade (v0.5.11)

**Core Experience:**
- **Auto-Navigation:** Creating a new chat now automatically switches focus to it.
- **Smart Auto-Titling:** New conversations start as "محادثة جديدة" and automatically generate a descriptive title.
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
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        // Optional: Clear table to ensure no ghost versions remain (use with caution in prod, safe for dev sync)
        // await sql`TRUNCATE TABLE "version_history" RESTART IDENTITY;`; 
        
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
