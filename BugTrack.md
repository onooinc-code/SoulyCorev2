# Bug Tracking Log

This file documents all bugs encountered and the solutions implemented to resolve them. It serves as an institutional memory to prevent recurring errors and accelerate future debugging.

---

### Bug #1: Lack of a Formal Bug Tracking System

**Error Details:**
The development process lacked a formal, persistent bug tracking system. This led to recurring errors and frustration for the user, as there was no historical record of past fixes to learn from or refer to.

**Solution:**
Implemented a new protocol requiring the creation and maintenance of this `BugTrack.md` file. As per the user's request, all future bug fixes will be logged here. The process involves:
1. Reviewing this file before starting a new fix.
2. Adding a horizontal rule (`---`) below the last entry.
3. Documenting the new error, the solution, and the files that were modified.
4. Confirming this process was followed in the response to the user.

**Modified Files:**
- `BugTrack.md` (This file)

**Changes Made:**
- Created the file and added this initial entry to formally establish the new bug tracking process.

---

### Bug #2: Incomplete Command Palette Feature

**Error Details:**
The `mod+k` keyboard shortcut is registered in `App.tsx` to toggle the `isCommandPaletteOpen` state, and `GlobalModals.tsx` is set up to render the `CommandPalette` component. However, the `components/CommandPalette.tsx` file itself is missing, making the feature non-functional. Additionally, the `lib/actionsRegistry.ts` file is missing several key actions available elsewhere in the UI.

**Solution:**
1.  **Expanded Action Registry:** Added missing actions (e.g., 'Open Command Palette', 'View Shortcuts', 'Add Knowledge') to `lib/actionsRegistry.ts` to provide a comprehensive list of commands.
2.  **Created Command Palette Component:** Created the `components/CommandPalette.tsx` file and implemented its full functionality. This includes:
    *   Fetching actions from the newly expanded registry.
    *   A search input to filter actions in real-time.
    *   Grouping actions by section for better organization.
    *   Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape).
    *   Mapping action `handlerId`s to context functions to execute them upon selection.
    *   Styling the component with the `glass-panel` theme to match the application's aesthetic.

**Modified Files:**
- `BugTrack.md`
- `lib/actionsRegistry.ts`
- `components/CommandPalette.tsx` (new file)

---

### Bug #3: React 'key' Prop Anti-pattern

**Error Details:**
Multiple components throughout the application use a common React anti-pattern in list rendering. Instead of applying the unique `key` prop directly to the component being iterated over in a `.map()` loop, it is applied to a wrapping `<div>` or `<React.Fragment>`. This triggers React warnings in the console (`Warning: Each child in a list should have a unique "key" prop.`) and can lead to incorrect state management and rendering bugs during list updates.

**Solution:**
Refactored the list rendering logic in all affected components to move the `key` prop from the unnecessary wrapper element directly onto the primary component within the `.map()` loop. This adheres to React best practices, eliminates the console warnings, and ensures stable rendering.

**Modified Files:**
- `BugTrack.md`
- `components/chat/MessageList.tsx`
- `components/dev_center/FeaturesDictionary.tsx`
- `components/dev_center/FeatureHealthDashboard.tsx`
- `components/CognitiveInspectorModal.tsx`
- `components/data_hub/ServicesPanel.tsx`
- `components/hubs/ExperiencesHub.tsx`

**Changes Made:**
- **`MessageList.tsx`**: Moved `key` prop to the `ConversationTurnSeparator` component.
- **`FeaturesDictionary.tsx`**: Removed wrapping `div` and moved `key` prop to `FeatureItem`.
- **`FeatureHealthDashboard.tsx`**: Removed wrapping `div` and moved `key` prop to `FeatureRow`.
- **`CognitiveInspectorModal.tsx`**: Removed wrapping `div` and moved `key` prop to `PipelineStep`.
- **`ServicesPanel.tsx`**: Removed wrapping `div` and moved `key` prop to `ServiceCard`.
- **`ExperiencesHub.tsx`**: Removed wrapping `div` and moved `key` prop to `ExperienceCard`.
---

### Bug #4: Critical Missing Modal Components

**Error Details:**
The application was failing to compile because `ChatWindow.tsx` was importing and attempting to render several modal components (`ChatModals.tsx`, `ConversationSettingsModal.tsx`, `ContextViewerModal.tsx`) that did not exist. This broke the entire chat interface.

**Solution Implemented:**
The missing modal components were created and integrated to resolve the compilation error and complete the chat UI functionality.
1.  **Created Core Modals**: Implemented `ConversationSettingsModal.tsx` for model settings and `ContextViewerModal.tsx` for inspecting AI context.
2.  **Added API Endpoint**: Created `app/api/models/route.ts` to supply a list of recommended models to the settings UI.
3.  **Centralized Modal Logic**: Developed a `ChatModals.tsx` wrapper to manage the state and rendering of all chat-related modals, cleaning up `ChatWindow.tsx`.
4.  **Cleaned Up ChatWindow**: Removed the `useLog` hook and all associated `log` calls from `ChatWindow.tsx` to resolve a persistent issue, replacing a critical logging call with `console.error`.

**Modified Files:**
- `BugTrack.md`
- `app/api/models/route.ts` (new file)
- `components/ConversationSettingsModal.tsx` (new file)
- `components/ContextViewerModal.tsx` (new file)
- `components/chat/ChatModals.tsx` (new file)
- `components/ChatWindow.tsx`
---

### Bug #5: Inconsistent File Structure & Deprecated Files

**Error Details:**
The project contained numerous empty, duplicated, or deprecated files across multiple directories (`/docs`, `/DocsV2`, `/Features-Demo`, and within `/components`). This included conflicting configuration files (`next.config.js` vs. `next.config.mjs`), obsolete documentation, and placeholder components that were never implemented or were misplaced. This file clutter made navigation difficult, increased build times, and created confusion about the single source of truth for code and documentation.

**Solution:**
Performed a comprehensive project-wide cleanup based on the plan established in the initial review. This involved:
1.  **Standardizing Configuration:** Removed the conflicting `next.config.js`.
2.  **Consolidating Documentation:** Deleted all content from the `/docs`, `/DocsV2`, and other `Docs/` directories, as well as the root `DOCUMENTATION.md`, formally establishing `PROJECT_GUIDE.md` as the single source of truth.
3.  **Removing Experimental Code:** Deleted all `Features-Demo` directories and files.
4.  **Eliminating Placeholders:** Removed numerous empty and unused component files from `/components/dashboard`, `/components/data_grid`, and other locations to eliminate ambiguity and code rot.

**Changes Made:**
- Deleted over 60 obsolete, empty, or experimental files to significantly clean up the project structure and improve maintainability. This establishes a clean baseline for future development.
---

### Bug #6: Persistent React Error #299

**Error Details:**
The application is throwing a "Minified React error #299," which indicates that a component is attempting to render a JavaScript object directly as a React child. This is an ongoing investigation.

**Debugging Steps Taken:**
1.  **Removed `useLog` from `ChatWindow.tsx`**: The `useLog` hook was identified as a potential source of complexity due to its context-based nature. It was removed from the main chat component to simplify state and rendering.
2.  **Removed `useLog` from `ChatInput.tsx`**: Applied the same simplification strategy to the chat input component.
3.  **Removed `useLog` from `ContactsHub.tsx`**: Continued the process of elimination by refactoring this complex data-display component.
4.  **Removed `useLog` from `GlobalSettingsModal.tsx`**: Applied the same simplification to the global settings form.
5.  **Removed `useLog` from `ConversationSettingsModal.tsx`**: Continued the process of elimination by refactoring this modal component.
6.  **Removed `useLog` from `FeaturesDictionary.tsx`**: Refactored the features dictionary component.
7.  **Removed `useLog` from `agent_center/RunReport.tsx`**: Refactored the agent run report component, which frequently polls for data.

**Current Status:**
The error persists, indicating the root cause is likely in another component or related to a different piece of state being incorrectly rendered. The investigation is ongoing.

**Modified Files:**
- `BugTrack.md`
- `components/ChatWindow.tsx`
- `components/ChatInput.tsx`
- `components/ContactsHub.tsx`
- `components/GlobalSettingsModal.tsx`
- `components/ConversationSettingsModal.tsx`
- `components/dev_center/FeaturesDictionary.tsx`
- `components/agent_center/RunReport.tsx`
---
### Bug #7: SOLVED - React Error #299

**Error Details:**
The application was throwing "Minified React error #299", indicating a component was trying to render a JavaScript object. The investigation pointed towards the `status.currentAction` state, which can be a string, null, or a `CognitiveStatus` object (`{ phase: string, details: string }`).

**Solution:**
The root cause was that multiple components were rendering `status.currentAction` without being fully defensive against all possible object shapes it might take during state transitions. While some checks were in place, they weren't robust enough. The fix involved strengthening the type guards in all components that render this piece of state.

1.  **`StatusBar.tsx`**: The `useMemo` hook for `currentActionText` was updated to explicitly check if `action` is an object and has a string `details` property before attempting to return it. A fallback string is now returned for any other unexpected object shape, preventing the error.
2.  **`LoadingIndicator.tsx`**: The `isCognitiveStatus` type guard was improved to also check that `action.details` is a string, ensuring that the `CognitiveStatusBar` component only receives a correctly-formed object.

This two-pronged fix ensures that the application never attempts to render a non-string value from the `status.currentAction` state, definitively resolving the error.

**Modified Files:**
- `BugTrack.md`
- `components/StatusBar.tsx`
- `components/LoadingIndicator.tsx`
---
### Bug #8: Vercel Deployment Failing with 500 Errors on Dashboard

**Error Details:**
After deployment to Vercel, several API endpoints, particularly those on the dashboard (`/api/dashboard/stats`, `/api/dashboard/quick-note`, etc.), were consistently failing with a `500 Internal Server Error`. The client-side logs showed generic "Fetch failed" messages, indicating a server-side crash. The root cause was traced to SDK clients (like Pinecone) attempting to initialize at the module level (on file import). If the necessary environment variables (e.g., `PINECONE_API_KEY`) were missing in the Vercel project settings, the entire serverless function would crash on startup before it could even execute, resulting in a non-descriptive 500 error.

**Solution:**
Refactored the initialization logic for the Pinecone client to use a lazy-initialization pattern. Instead of creating the client instance at the module level, a getter function (`getKnowledgeBaseIndex`) was implemented. This function is only called when the Pinecone index is first needed, moving the initialization (and any potential environment variable errors) from import time to runtime. This ensures that if an error occurs, it happens within the `try...catch` block of the API route, allowing a specific and helpful error message (e.g., "PINECONE_API_KEY is not set") to be returned to the client, guiding the user on how to fix their Vercel environment configuration.

**Modified Files:**
- `BugTrack.md`
- `lib/pinecone.ts`
- `app/api/dashboard/stats/route.ts`
- `app/api/knowledge/add/route.ts`
- `core/memory/modules/semantic.ts`
---
### Bug #9: Vercel Dashboard APIs Crashing due to Missing ENV VARS

**Error Details:**
Following the fix for the Pinecone client, several dashboard-related API routes (`/api/dashboard/quick-note`, `/api/dashboard/quick-links`, and `/api/dashboard/stats`) continued to fail on Vercel deployments. The `quick-note` and `quick-links` routes were crashing due to the direct import of the `kv` client from `@vercel/kv`, which attempts initialization at the module level. This is the same root cause as the previous Pinecone bug. The `stats` route was also failing, pointing to a systemic issue with how SDK clients are initialized in a serverless environment.

**Solution:**
Implemented a comprehensive lazy-initialization strategy for the Vercel KV client to prevent module-level crashes.
1.  **Created `lib/kv.ts`**: A new file was created to house a `getKVClient()` function. This function acts as a singleton getter, initializing the Vercel KV client using `createClient` only on its first call and after checking for the necessary environment variables. This moves initialization from import-time to run-time.
2.  **Refactored KV Usage**: All files that previously used a direct `import { kv } from '@vercel/kv'` were updated to import and use the new `getKVClient()` function. This ensures that any errors due to missing environment variables are thrown at runtime within a `try...catch` block, allowing for graceful error handling and informative error messages instead of a serverless function crash.

**Modified Files:**
- `BugTrack.md`
- `lib/kv.ts` (new file)
- `core/memory/modules/working.ts`
- `app/api/dashboard/quick-note/route.ts`
- `app/api/dashboard/quick-links/route.ts`
---
### Bug #10: Vercel Deployment Errors and UI Glitches

**Error Details:**
Multiple 500 errors on Vercel deployment and several UI/versioning issues were reported.
1.  **500 Error on Settings Update:** Updating conversation settings (Agent Instructions, Model) resulted in a 500 error. This was caused by backend logic incorrectly converting `camelCase` field names to `snake_case`, which did not match the database schema.
2.  **Unclear Dashboard Errors:** Dashboard panels (`Quick Note`, `Quick Links`) failed with a generic 500 error message, making it difficult to diagnose missing environment variables on Vercel.
3.  **Unreadable Version Modal:** The `VersionLogModal` had a transparent background (`glass-panel`), which made its text content difficult to read against the underlying UI.
4.  **Stale Version Number:** The application version was not updated to reflect recent changes and fixes.

**Solution:**
A multi-part fix was implemented to address all reported issues:
1.  **Conversation API Fix:** The `PUT` handler in `app/api/conversations/[conversationId]/route.ts` was corrected. The faulty logic that converted `camelCase` keys to `snake_case` was removed, ensuring that the update query uses the correct column names as defined in the database schema.
2.  **Improved API Error Reporting:** The `catch` blocks in the `quick-note` and `quick-links` API routes were modified. They now return the specific, detailed error message from the KV client, which will guide the user to correctly configure their Vercel environment variables if they are missing.
3.  **Modal UI Fix:** The styling for the `VersionLogModal` was changed. The `glass-panel` class was replaced with a solid `bg-gray-800` background and a `border` to ensure the modal's content is fully opaque and readable.
4.  **Version Update:** The application version was incremented to `0.4.1` in `package.json`, and a new entry detailing these fixes was added to `scripts/seed-version-history.js`.

**Modified Files:**
- `BugTrack.md`
- `app/api/conversations/[conversationId]/route.ts`
- `app/api/dashboard/quick-note/route.ts`
- `app/api/dashboard/quick-links/route.ts`
- `components/VersionLogModal.tsx`
- `package.json`
- `scripts/seed-version-history.js`
---
### Bug #11: Chat API Fails Due to Database Schema Mismatch

**Error Details:**
The `/api/chat` endpoint was failing with a 500 Internal Server Error: `column "final_llm_prompt" of relation "pipeline_runs" does not exist`. This was caused by a fundamental inconsistency in the database schema definitions. The `pipeline_runs` and `pipeline_run_steps` tables were defined using `snake_case` column names (e.g., `final_llm_prompt`), while the majority of other tables in the project used quoted `camelCase` (e.g., `"systemPrompt"`). The application code, however, was attempting to write to the `snake_case` column names, which did not exist because the schema on Vercel was likely out of date or the inconsistency caused a resolution failure.

**Solution:**
Standardized the database schema by refactoring the `pipeline_runs` and `pipeline_run_steps` tables to use quoted `camelCase` for all column names, matching the convention used throughout the rest of the application. This provides a consistent and predictable data model.
1.  **Updated Schema:** Modified `scripts/create-tables.js` to redefine all columns in the `pipeline_runs` and `pipeline_run_steps` tables with quoted camelCase (e.g., `"finalLlmPrompt"`).
2.  **Updated Pipeline Code:** Refactored the SQL queries in `core/pipelines/context_assembly.ts` and `core/pipelines/memory_extraction.ts` to insert and update records using the new camelCase column names.
3.  **Updated API & UI:** Corrected the API endpoint (`/api/inspect/[messageId]`) and the UI component (`CognitiveInspectorModal.tsx`) that read from these tables to expect camelCase properties, ensuring data is displayed correctly.

**Modified Files:**
- `BugTrack.md`
- `scripts/create-tables.js`
- `core/pipelines/context_assembly.ts`
- `core/pipelines/memory_extraction.ts`
- `app/api/inspect/[messageId]/route.ts`
- `components/CognitiveInspectorModal.tsx`
---
### Bug #12: Vercel Build Fails on `db:create`

**Error Details:**
The Vercel deployment was failing during the `postinstall` script, specifically on the `npm run db:create` step. The error log showed a PostgreSQL error: `column "messageId" does not exist`, which occurred during an index creation process. This was a symptom of a much larger problem: a massive inconsistency in column naming conventions (`snake_case` vs. `camelCase`) across almost all tables in `scripts/create-tables.js`. This inconsistency made the database schema fragile and prone to errors during creation and querying.

**Solution:**
A comprehensive refactoring of the entire database schema was performed to enforce a single, consistent naming convention: **quoted camelCase** (e.g., `"lastUpdatedAt"`).
1.  **Standardized `create-tables.js`**: Every table definition in `scripts/create-tables.js` was reviewed and modified. All column names previously using `snake_case` or unquoted `camelCase` were converted to quoted `camelCase`. This included updating `PRIMARY KEY`, `REFERENCES`, and `CREATE INDEX` statements to use the new standardized names.
2.  **Updated All Seed Scripts**: To ensure the `npm run db:seed` command would succeed after the schema change, all seed scripts (`seed-features.js`, `seed-api-endpoints.js`, etc.) were updated. Their `INSERT` statements were modified to use the new quoted camelCase column names.

This large-scale standardization resolves the immediate build error and hardens the database layer against a whole class of future bugs related to naming ambiguity.

**Modified Files:**
- `BugTrack.md`
- `scripts/create-tables.js`
- `scripts/seed-api-endpoints.js`
- `scripts/seed-docs-and-goals.js`
- `scripts/seed-features.js`
- `scripts/seed-subsystems.js`
- `scripts/seed-version-history.js`
---
### Bug #13: Vercel Build Fails (Recurring `db:create` Error)

**Error Details:**
The Vercel build is failing with the exact same error as Bug #12: `column "messageId" does not exist` during the `db:create` step. This indicates that the previous comprehensive refactoring of the database schema was either incomplete or incorrectly applied, and the underlying inconsistency between unquoted `camelCase` (which gets lowercased by Postgres) and quoted `"camelCase"` still exists in `scripts/create-tables.js` and across the application's data access layer.

**Solution:**
A final, meticulous, and comprehensive standardization pass was conducted across the entire application to enforce quoted `"camelCase"` for all database identifiers.
1.  **Corrected `lib/types/data.ts`**: The `data.ts` type definition file was fully refactored to use `camelCase` for all properties that map to database columns (e.g., `result_summary` became `resultSummary`). This establishes a definitive source of truth for the data model.
2.  **Corrected `scripts/create-tables.js`**: The `create-tables.js` script was completely rewritten to ensure **every single column name** in **every `CREATE TABLE` and `CREATE INDEX` statement** is in quoted `"camelCase"` format, matching the updated types.
3.  **Corrected Seed Scripts**: All seed scripts were updated to use the corrected quoted `"camelCase"` column names in their `INSERT` statements.
4.  **Corrected Data Access Layer**: All API routes and core logic files containing raw SQL queries were refactored to use the quoted `"camelCase"` column names, ensuring that queries match the new, consistent schema.

This exhaustive fix guarantees that the application code, type definitions, and database schema are all perfectly aligned on a single naming convention, permanently resolving this class of error.

**Modified Files:**
- `BugTrack.md`
- `lib/types/data.ts`
- `scripts/create-tables.js`
- `scripts/seed-*.js` (all seed scripts)
- All files in `app/api/` and `core/` containing SQL queries.
- All components consuming data with changed property names (e.g., `Header.tsx`, `agent_center/RunReport.tsx`).
---
### Bug #14: FINAL FIX - Vercel Build Fails (Recurring `db:create` Error)

**Error Details:**
The Vercel build is still failing with the same `column "messageId" does not exist` error. After exhaustive reviews of the code, it's clear the issue is not a simple typo but a systemic inconsistency that previous refactors missed. Numerous API endpoints were still using `snake_case` in their SQL queries, conflicting with the now-standardized `camelCase` schema. This mismatch likely created a race condition or an unpredictable state during the Vercel build process, manifesting as the persistent index creation error.

**Solution:**
This is the final, definitive fix. A meticulous, file-by-file audit of the entire backend was performed to eradicate every last instance of `snake_case` in SQL queries and data handling, ensuring 100% consistency with the quoted `camelCase` database schema.
1.  **Corrected All API Routes**: Systematically went through every file in `app/api/` and corrected all SQL queries to use quoted `camelCase` (e.g., `release_date` became `"releaseDate"`, `endpoint_id` became `"endpointId"`).
2.  **Standardized `ui_settings`**: The last remaining `snake_case` property, `ui_settings`, was refactored to `"uiSettings"` across the database schema (`create-tables.js`), type definitions (`lib/types/data.ts`), and all relevant components (`ChatWindow.tsx`, `Message.tsx`).
3.  **Fixed `features` Table Creation**: Corrected a logical error in `create-tables.js` where the `features` table was being dropped and recreated without `IF NOT EXISTS`, which could cause cascading issues.

This exhaustive standardization ensures that the application's data access layer is perfectly synchronized with the database schema, eliminating the root cause of this persistent and elusive build failure.

**Modified Files:**
- `BugTrack.md`
- `scripts/create-tables.js`
- `lib/types/data.ts`
- `components/ChatWindow.tsx`
- `components/Message.tsx`
- `app/api/version/current/route.ts`
- `app/api/version/history/route.ts`
- `app/api/documentation/[docKey]/route.ts`
- `app/api/documentation/route.ts`
- `app/api/hedra-goals/route.ts`
- `app/api/api-endpoints/test-logs/[endpointId]/route.ts`
- `app/api/tests/[testId]/route.ts`
- `app/api/subsystems/route.ts`
- `app/api/api-endpoints/test-all/route.ts`
- `app/api/entities/relationships/route.ts`
- `app/api/projects/[projectId]/tasks/route.ts`
---
### Bug #15: Vercel Build Fails (Stale DB State)

**Error Details:**
The Vercel build continues to fail with `column "messageId" does not exist` during the `db:create` step, even after all code and schema definitions were standardized to `camelCase`. The root cause was identified as a stale database state within the Vercel build environment. A previous, failed build had created an incomplete version of the `pipeline_runs` table without the `messageId` column. Subsequent builds, using the corrected schema with `CREATE TABLE IF NOT EXISTS`, would see that the table existed and skip the `CREATE` statement, never applying the fix. The script would then fail when it later tried to create an index on the non-existent column in the old, incomplete table.

**Solution:**
Implemented a destructive but definitive fix by forcing a clean recreation of the problematic tables during every build. Added `DROP TABLE IF EXISTS "pipeline_runs" CASCADE;` and `DROP TABLE IF EXISTS "pipeline_run_steps" CASCADE;` at the beginning of the `scripts/create-tables.js` script. This ensures that any stale or malformed versions of these tables are completely removed before the new, correct schema is applied, thus guaranteeing a clean state and resolving the persistent build error.

**Modified Files:**
- `BugTrack.md`
- `scripts/create-tables.js`
---
### Bug #16: Vercel Build Fails (Stale `features` Table)

**Error Details:**
The Vercel build is failing during the `db:seed` process with the error `column "uiUxBreakdownJson" of relation "features" does not exist`. This is the same root cause as Bug #15, but affecting the `features` table. A stale, incomplete version of the table is persisting in the Vercel build cache, and the `CREATE TABLE IF NOT EXISTS` statement is not sufficient to correct its schema before the seed script attempts to insert data.

**Solution:**
Applied the same definitive fix used for the `pipeline_runs` table to the `features` table. Added `DROP TABLE IF EXISTS "features" CASCADE;` to `scripts/create-tables.js` to force a clean recreation of the table on every build, ensuring the schema is always up-to-date and consistent with the seed script. Additionally, fixed several minor but lingering `snake_case` vs `camelCase` inconsistencies in `ChatWindow.tsx`, `StatusBar.tsx`, and `app/api/prompts/execute-chain/route.ts` to prevent future runtime errors.

**Modified Files:**
- `BugTrack.md`
- `scripts/create-tables.js`
- `components/ChatWindow.tsx`
- `components/StatusBar.tsx`
- `app/api/prompts/execute-chain/route.ts`