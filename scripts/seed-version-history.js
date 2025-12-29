
// scripts/seed-version-history.js
const { sql } = require('@vercel/postgres');

const versionData = [
    {
        version: '0.5.11',
        releaseDate: new Date().toISOString(),
        changes: `
### 🚀 UX & Traceability Upgrade (v0.5.11)

**Core Experience:**
- **Auto-Navigation:** Creating a new chat now automatically switches focus to it, clearing the previous view immediately.
- **Smart Auto-Titling:** New conversations start as "محادثة جديدة" and automatically generate a descriptive title after the first AI response.

**System Observability:**
- **Deep Trace Links:** System logs in the Dashboard and Log Panel are now clickable, jumping directly to the specific conversation context where the event occurred.
- **Granular Pipeline Logging:** Added specific \`conversationId\` tracking to all memory extraction and context assembly steps.
`
    },
    {
        version: '0.5.10',
        releaseDate: new Date('2025-12-28T10:00:00Z').toISOString(),
        changes: `
### 🛠️ Robust Auth Strategy (v0.5.10)

**Critical Fixes:**
- **Smart Key Selection:** The system now intelligently iterates through all available environment variables (\`API_KEY\`, \`GEMINI_API_KEY\`) and prioritizes the one that matches the Google API Key format (starts with \`AIza\`). This resolves issues where an empty or invalid primary key would block the valid backup key.
- **Enhanced Sanitization:** Hardened logic to strip surrounding quotes and trim whitespace across all authentication entry points.

**Diagnostics:**
- **Key Source Visibility:** The diagnostics panel now correctly reports which specific environment variable (and its validity status) is currently active.
`
    },
    {
        version: '0.5.9',
        releaseDate: new Date('2025-12-27T10:00:00Z').toISOString(),
        changes: `
### 🛠️ Strict Auth Sanitization (v0.5.9)

**Security & Reliability:**
- **Aggressive Key Cleaning:** Implemented logic to strip surrounding quotes (\`"\` or \`'\`) from API keys retrieved from environment variables. This handles common configuration errors in Vercel.
- **Prefix Validation:** The system now warns in the server logs if an API Key does not start with \`AIza\`.
- **Diagnostic Transparency:** The Cognitive Diagnostics panel now reports the key prefix (safe subset) to help verify if the key is loaded correctly or corrupted by formatting.

**System Consistency:**
- Applied the new sanitization logic across all entry points: Core Provider, Shared Library, and Model Discovery route.
`
    },
    {
        version: '0.5.8',
        releaseDate: new Date('2025-12-26T10:00:00Z').toISOString(),
        changes: `
### 🛠️ Key Sanitization & Diagnostics (v0.5.8)

**Core Logic:**
- **Key Trimming:** The Google GenAI client initialization now automatically trims whitespace from API keys (\`API_KEY\` or \`GEMINI_API_KEY\`) to prevent copy-paste errors from breaking authentication.

**Dev Center:**
- **AI Connectivity Check:** Added a live test in the Cognitive Diagnostics panel that pings Google's API. This definitively separates configuration errors from runtime issues.
- **Source Visibility:** The diagnostics panel now indicates which environment variable is currently active (\`API_KEY\` vs \`GEMINI_API_KEY\`).
`
    },
    {
        version: '0.5.7',
        releaseDate: new Date('2025-12-26T08:00:00Z').toISOString(),
        changes: `
### 🛠️ Global Auth Consistency (v0.5.7)

**Configuration:**
- **Standardized API Key Check:** Updated all backend services (Memory Extraction, Agents, Synthesis, and core LLM provider) to consistently check for both \`API_KEY\` and \`GEMINI_API_KEY\`. This resolves intermittent authentication failures.
- **Enhanced Debugging:** Added secure logging to the LLM provider to confirm which API key variable is being detected during initialization.
`
    },
    {
        version: '0.5.6',
        releaseDate: new Date('2025-12-25T14:00:00Z').toISOString(),
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
        releaseDate: new Date('2025-12-25T12:00:00Z').toISOString(),
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
        releaseDate: new Date('2025-12-25T11:00:00Z').toISOString(),
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
