
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.7',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ Global Auth Consistency (v0.5.7)

**Configuration:**
- **Standardized API Key Check:** Updated all backend services (Memory Extraction, Agents, Synthesis, and core LLM provider) to consistently check for both \`API_KEY\` and \`GEMINI_API_KEY\`. This resolves intermittent authentication failures.
- **Enhanced Debugging:** Added secure logging to the LLM provider to confirm which API key variable is being detected during initialization.
`
    },
    {
        version: '0.5.6',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ Auth Config Fixes (v0.5.6)

**Configuration:**
- **API Key Fallback:** Added support for both \`API_KEY\` and \`GEMINI_API_KEY\` environment variables to resolve authentication errors on Vercel.
- **Improved Error UI:** Added a direct link to Vercel settings when authentication fails.

**System Reliability:**
- **Debug Logging:** Enhanced server-side logging to confirm API key presence during initialization.
`
    },
    {
        version: '0.5.5',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ Build & Stability Fixes (v0.5.5)

**Core Reliability:**
- **Deployment Fix:** Removed database scripts from build process to prevent Vercel deployment failures.
- **Monitor UI:** Fixed an issue where the "Live Tool Monitor" and "Memory Inspector" would hang indefinitely if the backend API failed.
- **Error Handling:** Improved error messages for API Key configuration issues.
`
    },
    {
        version: '0.5.4',
        releaseDate: new Date().toISOString(),
        changes: `
### 🛠️ Build & Stability Fixes (v0.5.4)

**Core Reliability:**
- **Deployment Fix:** Resolved a Vercel build failure caused by database connection timeouts during the install phase.
- **Monitor UI:** Fixed an issue where the "Live Tool Monitor" and "Memory Inspector" would hang indefinitely if the backend API failed. They now correctly report errors.

**Improvements:**
- **Error Handling:** Enhanced error detection to catch null responses from the AI provider.
`
    },
    {
        version: '0.5.3',
        releaseDate: '2025-12-25T10:00:00Z',
        changes: `
### 🛡️ Resilience Update (v0.5.3)

**System Stability:**
- **Monitor Recovery:** Fixed an issue where the Cognitive Monitors would get stuck in a "Querying..." state if the API call failed.
- **Error Handling:** Improved error reporting for API Key authentication failures.
`
    },
    {
        version: '0.4.16',
        releaseDate: '2025-12-23T14:00:00Z',
        changes: `
### 🕵️ Memory Transparency & Deep Logging (v0.4.16)

**New Cognitive Features:**
- **Extracted Badge:** AI message footer now shows harvested facts.
- **Deep-Step Logging:** Granular logging for internal pipeline steps.
- **Unified Inspector:** Enhanced Cognitive Inspector.
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
