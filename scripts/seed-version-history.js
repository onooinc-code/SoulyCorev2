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
        release_date: new Date().toISOString(), // Today's date
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
    }
];

async function seedVersionHistory() {
    console.log("Seeding version history...");
    try {
        for (const version of versionData) {
            await sql`
                INSERT INTO version_history (version, release_date, changes)
                VALUES (${version.version}, ${version.release_date}, ${version.changes})
                ON CONFLICT (version) DO NOTHING;
            `;
        }
        console.log(`Successfully seeded ${versionData.length} version history entries.`);
    } catch (error) {
        console.error("Error seeding version_history table:", error);
        process.exit(1);
    }
}

seedVersionHistory();
