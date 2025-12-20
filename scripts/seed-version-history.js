
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.4.6',
        releaseDate: new Date().toISOString(),
        changes: `
### 🔥 Major Overhaul: The Polish Update (v0.4.6)

**Visual & UX Upgrades:**
- **Invisible Scrollbars:** Completely rewrote the CSS engine to use ultra-minimal, modern scrollbars that don't break the dark theme immersion.
- **Dynamic Header:** The top header now intelligently displays the active section name (e.g., "Agent Center", "Dashboard") instead of a static "New Chat".
- **Full-Width Messages:** Chat bubbles now utilize the full screen width for better readability of long text and code blocks.

**Chat & Input Evolution:**
- **Power Grid Input:** The chat input area has been supercharged. Removed the disclaimer and added a **16-button Quick Action Grid** for one-click utility (Summarize, Debug, Translate, etc.).
- **Smart Triggers:** Added basic support for slash commands (\`/\`) and entity mentions (\`@\`).
- **Stats:** The Conversation List now displays the message count and token usage for each chat.

**Functionality Fixes:**
- **Settings Persistence:** Fixed a critical bug where Model and Agent settings weren't saving or persisting to new chats. Added "Presets" for personas and temperature.
- **Context Menu 2.0:** A complete redesign of the right-click menu with nested sub-menus, icons, and a quick-access toolbar for Copy/Paste.
- **Mobile Experience:** The conversation list now auto-closes after selection on mobile devices.
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
