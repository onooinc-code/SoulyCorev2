// scripts/seed-version-history.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.1.0',
        release_date: '2024-07-20T10:00:00Z',
        changes: `
- **Initial Release:** Deployed the foundational SoulyCore application.
- **Core Features:** Implemented conversation management, chat UI, and the initial memory system.
- **Dev Tools:** Launched the first version of the SoulyDev Center with a Features Dictionary.`
    },
    {
        version: '0.2.0',
        release_date: '2024-07-22T10:00:00Z',
        changes: `
- **New: Versioning System!**
  - Added a version card to the header to display the current version.
  - Implemented a hover panel on the version card to show recent changes.
  - Created a full Version Log modal to view all historical updates.
- **New: Development Guidelines**
  - Added a formal document outlining the development workflow and rules for AI agents.
- **Backend:**
  - Added the \`version_history\` table to the database.
  - Created new API endpoints at \`/api/version/...\` to serve version data.`
    },
    {
        version: '0.3.0',
        release_date: '2024-07-23T10:00:00Z',
        changes: `
- **Bug Fix & Stability:** Fixed a critical layout 'jumping' bug in the chat window by implementing a more robust scrolling mechanism. This ensures the chat view remains stable when new messages are added.
- **Code Health:** Resolved multiple TypeScript type errors, most notably in the Context Menu component, improving overall code quality and maintainability.
- **UX:** The application is now more stable, with layout shifts on load being eliminated for a smoother user experience.`
    },
    {
        version: '0.3.1',
        release_date: new Date().toISOString(),
        changes: `
- **Bug Fix: Keyboard Shortcuts:** Resolved a critical bug where keyboard shortcuts would not work until the user interacted with the app. The app now automatically focuses itself when entering fullscreen mode, ensuring shortcuts are always responsive.
- **Improvement: Fullscreen Mode:** Enhanced the fullscreen experience by removing mobile view constraints, allowing the application to utilize the entire screen space as intended.`
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        for (const version of versionData) {
            await sql`
                INSERT INTO version_history (version, release_date, changes)
                VALUES (${version.version}, ${version.release_date}, ${version.changes})
                ON CONFLICT (version) DO UPDATE SET
                    release_date = EXCLUDED.release_date,
                    changes = EXCLUDED.changes;
            `;
        }
        console.log(`Successfully seeded ${versionData.length} version history entries.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
