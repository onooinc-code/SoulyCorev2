
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.4.12',
        releaseDate: new Date().toISOString(),
        changes: `
### 📐 Symmetric Interface Update (v0.4.12)

**Visual Polish:**
- **Symmetric Toolbars:** Both the top (Prompt Macros) and bottom (Text Formatting) toolbars now have exactly 12 buttons each.
- **Identical Layout:** Applied a uniform layout strategy (Flex Distribution) to both toolbars, ensuring buttons are the exact same size and spacing across the interface.
- **Curated Actions:** Reduced the top toolbar actions to the most essential 12 items to fit the new balanced design.
`
    },
    {
        version: '0.4.11',
        releaseDate: new Date('2024-07-29T16:00:00Z'),
        changes: `
### 🖌️ Visual Refresh & Compact Mode (v0.4.11)

**Toolbar Redesign:**
- **Minimalist Aesthetic:** Removed text labels from both top and bottom toolbars for a cleaner, modern look, relying purely on iconography and tooltips.
- **Optimized Layout:** Buttons are now intelligently distributed to fill the available screen width, ensuring better spacing and touch targets.
- **Increased Input Space:** Leveraged the saved vertical space to expand the main chat input area, making it easier to write and review longer messages (defaulting to 3 rows).

**UX Improvements:**
- **Fluid Responsiveness:** The new toolbar layout adapts better to different screen sizes, providing a consistent experience on desktop and mobile.
`
    },
    {
        version: '0.4.10',
        releaseDate: new Date('2024-07-29T14:00:00Z'),
        changes: `
### 🛠️ Customization & Productivity (v0.4.10)

**New Features:**
- **Customizable Prompt Buttons:** You can now **Right-Click** on any button in the top toolbar (Summarize, Enhance, etc.) to edit its label and prompt template.
- **Persistent Settings:** Changes to toolbar buttons are saved to your global settings and persist across sessions.

**Enhancements:**
- **Toolbar UI:** Improved the edit modal for a seamless experience directly within the chat input area.
`
    },
    {
        version: '0.4.9',
        releaseDate: new Date('2024-07-29T12:00:00Z'),
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
