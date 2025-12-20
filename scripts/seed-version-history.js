
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.1.0',
        releaseDate: '2024-07-20T10:00:00Z',
        changes: `
- **Initial Release:** Deployed the foundational SoulyCore application.
- **Core Features:** Implemented conversation management, chat UI, and the initial memory system.
- **Dev Tools:** Launched the first version of the SoulyDev Center with a Features Dictionary.`
    },
    {
        version: '0.2.0',
        releaseDate: '2024-07-22T10:00:00Z',
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
        releaseDate: '2024-07-23T10:00:00Z',
        changes: `
- **Bug Fix & Stability:** Fixed a critical layout 'jumping' bug in the chat window by implementing a more robust scrolling mechanism. This ensures the chat view remains stable when new messages are added.
- **Code Health:** Resolved multiple TypeScript type errors, most notably in the Context Menu component, improving overall code quality and maintainability.
- **UX:** The application is now more stable, with layout shifts on load being eliminated for a smoother user experience.`
    },
    {
        version: '0.4.0',
        releaseDate: '2024-07-25T10:00:00Z',
        changes: `
- **Major UI Overhaul:** Implemented a new 'glassmorphism' and 'metal' visual theme across the application for a more modern and professional look.
- **New: Progress & Status System:**
  - Added a top-loading progress bar for view navigation.
  - Added a global App Status Bar for background tasks.
  - Enhanced contextual loading indicators.
- **New: Settings Architecture:**
  - All UI settings (font size, alignment) are now saved to the database, ensuring persistence across sessions.
  - Model selection is now a dynamic dropdown populated from the backend.
  - Added UI for a multi-model strategy, allowing different models for different tasks.
- **Bug Fixes:**
  - Fixed all non-functional actions in the Header and Right-Click Context Menu.
  - Fixed non-functional message bubble alignment buttons.
- **UX Improvements:**
  - Message bubbles are now full-width for better space utilization.
  - The Version History modal is now functional and redesigned.`
    },
    {
        version: '0.4.1',
        releaseDate: '2024-07-26T10:00:00Z',
        changes: `
- **Critical Bug Fix: 500 Errors:** Resolved multiple 500 Internal Server Errors on Vercel deployments.
  - Fixed a bug in the conversation update API that caused all settings changes (e.g., Agent Instructions, Model selection) to fail.
  - Improved error reporting for dashboard APIs to provide clear guidance on missing environment variables.
- **UI Fix: Version Log Modal:** Corrected the styling of the Version Log modal, replacing the transparent background with a solid one to ensure readability.
- **Stability:** These changes significantly improve the stability and usability of the deployed application.`
    },
    {
        version: '0.4.5',
        releaseDate: new Date().toISOString(),
        changes: `
- **Visual Polish: The Invisible Scrollbar:**
  - Redesigned the scrollbar to be ultra-minimalist with a transparent track. This eliminates the "ugly block" effect on the right side of the screen, creating a true full-screen immersion feel.
- **UX: Layout fixes:**
  - Increased top padding for the chat window (\`pt-20\`) to ensure the first message bubble is never hidden behind the header glass, fixing the "cut off" message issue.
- **Error Handling:**
  - Completely redesigned the error display. Instead of a massive red wall that blocks the chat, errors (like API Rate Limits) now appear as a small, dismissible notification banner that doesn't obstruct your view.
- **Internationalization:**
  - Fixed the Version Log text direction. English technical logs now correctly display Left-to-Right (LTR) for better readability.`
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
