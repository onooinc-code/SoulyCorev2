
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.4.7',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ Critical Fixes & Enhancements (v0.4.7)

**Core Improvements:**
- **Model List:** Fixed the AI Model dropdown to display a comprehensive list of all Gemini models (including Pro, Flash, Vision) by default, instead of just 3.
- **Chat Input Toolbar:** Implemented a visible, horizontally scrollable toolbar above the chat input with 15+ quick action buttons (Summarize, Translate, Code, etc.) for immediate access.
- **Header Layout:** Resolved the layout issue where the Header was obscuring content in the Dashboard and other hubs by adjusting the global layout strategy.

**Bug Fixes:**
- **Copy/Paste:** Fixed the context menu "Paste" functionality to correctly insert text into the active chat input.
- **New Chat Navigation:** Creating a new conversation now immediately switches the view to the chat interface.
- **Loading Stability:** Added robustness to the tool fetching API to prevent "System Error" messages when loading conversations.
- **Context Menu:** Added new icon buttons (Cut, Select All, Delete) to the right-click menu.
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
