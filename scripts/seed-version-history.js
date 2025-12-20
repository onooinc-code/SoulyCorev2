
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.4.9',
        releaseDate: new Date().toISOString(),
        changes: `
### 🎨 UI & Functional Refinement (v0.4.9)

**UI Enhancements:**
- **Toolbar Uniformity:** Standardized the size of the top and bottom toolbars in the chat input for a cleaner, more consistent look.

**New Chat Features:**
- **Text Formatting Tools:** Replaced technical developer tools with rich text formatting options in the bottom toolbar:
  - **Bold**, **Italic**, **Strikethrough**
  - **List creation**, **Block Quotes**, **Inline Code**
  - **Link insertion**

**Context Menu Upgrade:**
- **Quick Actions Redesign:** Removed generic edit actions (Select All, Cut, Delete) from the context menu header.
- **New Shortcuts:** Added instant access buttons for **New Chat**, **Refresh App**, and **Global Settings** directly within the right-click menu.
`
    },
    {
        version: '0.4.8',
        releaseDate: new Date('2024-07-29T10:00:00Z'),
        changes: `
### 🚀 Fixes & Stability (v0.4.8)

**Critical Fixes:**
- **Changelog System:** Fixed the version history not updating in the UI. Implemented a fail-safe mechanism to ensure new release notes appear immediately.
- **Data Integrity:** Updated API routes to ensure robustness against stale database schemas.

**Next Steps (Immediate):**
- Solving the "3 Models Only" issue.
- Restoring the Chat Input Toolbar.
- Fixing Copy/Paste functionality.
`
    },
    {
        version: '0.4.7',
        releaseDate: new Date('2024-07-28T10:00:00Z'),
        changes: `
### 🛠️ Critical Fixes & Enhancements (v0.4.7)

**Core Improvements:**
- **Model List:** Fixed the AI Model dropdown to display a comprehensive list of all Gemini models (including Pro, Flash, Vision) by default.
- **Chat Input Toolbar:** Implemented a visible, horizontally scrollable toolbar above the chat input with 15+ quick action buttons.
- **Header Layout:** Resolved the layout issue where the Header was obscuring content.

**Bug Fixes:**
- **Copy/Paste:** Fixed the context menu "Paste" functionality.
- **New Chat Navigation:** Creating a new conversation now immediately switches the view.
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
