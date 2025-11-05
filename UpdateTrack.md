# Feature & Update Tracking Log

This file documents all new features, enhancements, and significant modifications to the project. It serves as a chronological record of development progress. Before making any new feature change, this file must be read, and a new entry must be added below the last horizontal rule.

---

### Update #1: Establishment of Formal Development Tracking System

**Details:**
Created a new, formalized system for tracking development progress and bug fixes to improve project clarity and maintainability. This involves two new markdown files.

**Modified Files:**
- `UpdateTrack.md` (new file)
- `ProjectDevelopInstructions.md` (new file)

**Changes Made:**
- **`UpdateTrack.md`**: This file was created to serve as a log for all new features, enhancements, and structural changes. It will be updated with every non-bug-fix modification.
- **`ProjectDevelopInstructions.md`**: This file was created to provide clear, persistent instructions on how to use both `BugTrack.md` and this `UpdateTrack.md` file, ensuring a consistent development process.
---

### Update #2: Implementation of Projects Hub

**Details:**
Implemented a new "Projects Hub" to replace the basic "Tasks Hub". This feature provides a more structured way to manage projects and their associated tasks. Each project can have a list of tasks, and users can trigger an AI-powered summarization of the project's status, which is displayed in a modal.

**Modified Files:**
- `UpdateTrack.md`
- `scripts/create-tables.js`
- `lib/types/data.ts`
- `app/api/projects/route.ts` (new file)
- `app/api/projects/[projectId]/route.ts` (new file)
- `app/api/projects/[projectId]/tasks/route.ts` (new file)
- `app/api/projects/[projectId]/summarize/route.ts` (new file)
- `components/ProjectsHub.tsx` (new file)
- `components/NavigationRail.tsx`
- `components/views/ActiveViewRenderer.tsx`
- `lib/actionsRegistry.ts`
- `components/Icons.tsx`
- `components/icons/ClipboardDocumentListIcon.tsx` (new file)
- `components/icons/TasksIcon.tsx`

**Changes Made:**
- **Backend**: Added `projects` and `project_tasks` tables to the database. Created a full suite of API endpoints for CRUD operations on projects and their tasks, plus an endpoint for AI summarization.
- **Frontend**: Created the `ProjectsHub.tsx` component to display and manage projects.
- **Integration**: Updated the `NavigationRail`, `ActiveViewRenderer`, and `actionsRegistry` to integrate the new hub into the application, replacing the old Tasks Hub link.
- **Icons**: Added a new `ClipboardDocumentListIcon` for the Projects Hub and updated the old `TasksIcon` to avoid visual duplication.
---

### Update #3: Implementation of Experiences Hub

**Details:**
Implemented the "Experiences Hub" to fix a missing component error and provide a UI for managing learned agent workflows. An "experience" is a generalized, reusable plan created by the AI after a successful autonomous agent run. This hub allows the user to view these learned experiences, their trigger keywords, and their abstract plans.

**Modified Files:**
- `UpdateTrack.md`
- `components/hubs/ExperiencesHub.tsx` (new file)
- `app/api/experiences/route.ts` (new file)
- `app/api/experiences/[experienceId]/route.ts` (new file)

**Changes Made:**
- **Backend**: Created new API endpoints (`/api/experiences` and `/api/experiences/[experienceId]`) to fetch and delete learned experiences from the database.
- **Frontend**: Created the `ExperiencesHub.tsx` component, which displays a list of learned experiences in a card format. Each card shows the goal template, trigger keywords, and the abstract plan. It also includes functionality to delete an experience.
- **Integration**: This component was already referenced in `ActiveViewRenderer.tsx`, resolving a runtime error by its creation.
---

### Update #4: Implement Communication Hub Backend & Frontend

**Details:**
Implemented the backend and frontend functionality for the Communication Hub. This replaces the mock data in the "Channel Dashboard" with live data from the `comm_channels` database table. Users can now create persistent webhook channels, and the "Send Broadcast" feature now logs events to the database instead of being a simulation.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/comm/channels/route.ts` (new file)
- `app/api/comm/broadcast/route.ts` (new file)
- `components/hubs/CommunicationHub.tsx` (new file)
- `components/hubs/comm_hub/ChannelDashboard.tsx` (new file)
- `components/hubs/comm_hub/WebhookCreator.tsx` (new file)
- `components/hubs/comm_hub/BroadcastManager.tsx` (new file)

**Changes Made:**
- **API `channels` & `broadcast`**: Created `GET` and `POST` endpoints to manage channels and send broadcast messages.
- **Components**: Created a suite of new components to form the hub's UI: `CommunicationHub` for the main view, `ChannelDashboard` to display channels, `WebhookCreator` for adding new channels, and `BroadcastManager` for sending messages. The components are fully wired to the backend APIs and include state management, user feedback, and notifications.
- **Integration**: The `CommunicationHub` is now a fully functional view accessible from the main navigation.
---

### Update #5: Implement Webhook Notification Sending

**Details:**
Implemented the feature to send notifications to a selected webhook channel. This enhances the Communication Hub by making the created webhooks functional. The `BroadcastManager` UI has been updated to include a channel selector, and a new API endpoint (`/api/comm/notify/[channelId]`) has been created to handle the outgoing POST request to the target webhook URL.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/comm/notify/[channelId]/route.ts` (new file)
- `components/hubs/comm_hub/BroadcastManager.tsx`

**Changes Made:**
- **API `notify`**: Created a new dynamic API route that accepts a `channelId` and a message payload. It fetches the channel's configuration, constructs a POST request, and sends the notification to the external webhook URL. It also logs the outcome of the send attempt.
- **`BroadcastManager.tsx`**: Refactored the component to fetch and display a dropdown of available webhook channels. Users can now select a target channel for their message. The "Send" logic now calls the new `/api/comm/notify/[channelId]` endpoint.
---

### Update #6: Add Webhook URL Configuration

**Details:**
Enhanced the Communication Hub by allowing users to specify a destination URL when creating a new webhook channel. This makes the "Send Notification" feature fully functional, as it now has an endpoint to send data to.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/comm/channels/route.ts`
- `components/hubs/comm_hub/WebhookCreator.tsx`
- `components/hubs/comm_hub/ChannelDashboard.tsx`

**Changes Made:**
- **`WebhookCreator.tsx`**: Added a "Webhook URL" input field that appears when the channel type is 'webhook'.
- **`app/api/comm/channels/route.ts`**: The POST endpoint now accepts a `config` object in the request body and saves it to the `config_json` field in the database.
- **`ChannelDashboard.tsx`**: The `ChannelCard` component now displays the configured URL for webhook channels, providing better visibility.
- **`UpdateTrack.md`**: Added this entry to document the update.
---

### Update #7: Implement Unified Inbox

**Details:**
Implemented the "Unified Inbox" feature within the Communication Hub. This provides a centralized view of all incoming messages, currently sourced from received webhooks.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/comm/inbox/route.ts` (new file)
- `components/hubs/comm_hub/UnifiedInbox.tsx` (new file)
- `components/hubs/CommunicationHub.tsx`

**Changes Made:**
- **API `inbox`**: Created a new `GET` endpoint that queries the `logs` table for entries related to received webhooks, simulating an inbox data source.
- **`UnifiedInbox.tsx`**: Created a new component that fetches data from the inbox API and displays each incoming message with its timestamp, content, and a collapsible JSON payload viewer.
- **`CommunicationHub.tsx`**: Integrated the new `UnifiedInbox` component, which now renders when the "Unified Inbox" tab is active, replacing the previous placeholder.
---

### Update #8: Display Incoming Webhook URL

**Details:**
Enhanced the Communication Hub to display the unique incoming webhook URL after a channel is created and on the channel's information card. This provides users with the necessary URL to configure external services to send webhooks to the application's Unified Inbox.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/comm/channels/route.ts`
- `components/hubs/comm_hub/WebhookCreator.tsx`
- `components/hubs/comm_hub/ChannelDashboard.tsx`

**Changes Made:**
- **API `channels`**: The `GET` and `POST` endpoints now dynamically construct and include an `incomingUrl` property for each webhook channel in their responses.
- **`WebhookCreator.tsx`**: After successfully creating a webhook channel, the component now displays a success view with the generated incoming URL and a "Copy to Clipboard" button.
- **`ChannelDashboard.tsx`**: The `ChannelCard` component has been updated to display both the incoming and outgoing URLs for a webhook channel, each with its own convenient copy button.
---

### Update #9: Implement Full Projects Hub CRUD

**Details:**
Made the Projects Hub fully interactive by implementing Create, Read, Update, and Delete (CRUD) functionality for both projects and their associated tasks. Users can now manage their projects lifecycle directly from the UI.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/projects/[projectId]/tasks/[taskId]/route.ts` (new file)
- `components/modals/CreateProjectModal.tsx` (new file)
- `components/modals/CreateTaskModal.tsx` (new file)
- `components/ProjectsHub.tsx`
- `components/Icons.tsx`
- `components/icons/PlusCircleIcon.tsx` (new file)
- `components/SummaryModal.tsx` (deleted)
- `components/modals/SummaryModal.tsx` (new file)
- `components/chat/ChatModals.tsx`

**Changes Made:**
- **Backend**: Added a new API endpoint for updating and deleting individual tasks.
- **Frontend**: Created two new modals (`CreateProjectModal` and `CreateTaskModal`) to handle creation of projects and tasks.
- **`ProjectsHub.tsx`**: Overhauled the component to manage modal states and handle API calls for creating projects, adding tasks, toggling task completion status, and deleting tasks. The UI now includes buttons for all these actions.
- **Icons**: Added a new `PlusCircleIcon` for use in the hub.
- **`SummaryModal`**: Made the modal more generic by accepting a `title` prop and moved it into the `/modals` directory for better organization. Updated `ChatModals.tsx` to reflect this change.
---

### Update #10: Major Project Cleanup & Refactoring

**Details:**
Completed the project stabilization and cleanup plan. This major update focused on eliminating technical debt, resolving structural inconsistencies, and removing all deprecated and unused files from the codebase. The primary goal was to create a clean, stable foundation for future development.

**Modified Files:**
- `UpdateTrack.md`
- `BugTrack.md`
- Numerous files were deleted across the project.

**Changes Made:**
- **File Deletion**: Removed over 60 empty, duplicated, or obsolete files, including old documentation, demo HTML files, and placeholder components. This significantly reduces the project's footprint and improves clarity.
- **Bug Fixes**: Confirmed that all critical compilation errors (TypeScript type errors, incorrect import paths, React `key` prop issues) identified in the initial review have been resolved.
- **Documentation**: Added a detailed entry to `BugTrack.md` documenting the file structure issues and the cleanup process.
---

### Update #11: Final Data Layer Standardization & Stabilization

**Details:**
Performed a final, exhaustive audit and refactoring of the entire application's data access layer. This update eliminated all remaining inconsistencies between `snake_case` and `camelCase` naming conventions in API endpoints, UI components, and database queries. By enforcing a single, consistent `camelCase` standard across the board, this change resolves a persistent source of Vercel build failures and runtime errors, leading to a significantly more stable and maintainable codebase.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/brains/route.ts`
- `app/api/brains/[brainId]/route.ts`
- `components/brain_center/BrainManagementTab.tsx`
- `app/api/tests/route.ts`
- `app/api/contacts/test/route.ts`
- `components/dev_center/api_command_center/ResponsePanel.tsx`
- `app/api/dashboard/charts/route.ts`
---
### Update #12: Personalized Entity Salience

**Details:**
Implemented a system to track and utilize the "importance" of entities based on user interaction. The AI now prioritizes entities that are accessed frequently and recently, leading to more contextually relevant responses.

**Modified Files:**
- `UpdateTrack.md`
- `scripts/create-tables.js`
- `lib/types/data.ts`
- `core/pipelines/context_assembly.ts`
- `components/hubs/EntityHub.tsx`

**Changes Made:**
- **Database Schema**: Added `accessCount` and `lastAccessedAt` columns to the `entity_definitions` table to store salience metadata.
- **Context Assembly Pipeline**: The pipeline now fetches a larger set of candidate entities from the vector store and re-ranks them using a salience score calculated from vector similarity, access frequency, and recency. It also updates the salience data for used entities in the background.
- **Entity Hub UI**: The `EntityHub` table now displays the "Access Count" and "Last Accessed" date for each entity, with both columns being sortable, providing visibility into the new system.
---

### Update #13: AI-Generated Entity Summaries

**Details:**
Implemented a feature to allow the AI to dynamically re-summarize an entity based on all known information. This transforms static descriptions into living summaries that evolve as more context is gathered.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/entities/[entityId]/summarize/route.ts` (new file)
- `components/hubs/EntityDetailPanel.tsx`
- `components/hubs/EntityHub.tsx`

**Changes Made:**
- **Backend**: Created a new API endpoint that, when called for a specific entity, gathers its description, relationships, and recent message mentions. It then prompts a powerful AI model to synthesize this data into a new, comprehensive description and updates the entity in the database, logging the change to its history.
- **Frontend**: Added an "AI Summarize" button to the `EntityDetailPanel`. This button triggers the backend summarization process and provides loading feedback.
- **Integration**: The `EntityHub` was updated to pass a refresh function to the detail panel, ensuring the UI updates automatically to display the new, AI-generated summary upon completion.
---

### Update #14: Automated Clustering & Categorization

**Details:**
Implemented an advanced "AI Categorizer" tool within the Entity Hub. This feature allows the AI to analyze the entire set of entities, identify semantically similar groups, and propose new, more accurate categories for them. Users can review these suggestions in a dedicated modal and apply them with a single click.

**Modified Files:**
- `UpdateTrack.md`
- `app/api/entities/suggest-categories/route.ts` (new file)
- `components/hubs/AICategorizerModal.tsx` (new file)
- `components/hubs/EntityHub.tsx`

**Changes Made:**
- **Backend**: Created a new API endpoint (`/api/entities/suggest-categories`) that fetches all entities, passes them to a powerful reasoning model (`gemini-2.5-pro`) with a specific prompt, and receives a structured JSON response of suggested categories and their member entities (including IDs).
- **Frontend**:
    - Created a new `AICategorizerModal.tsx` component to manage the user-facing workflow. It calls the API, displays a loading state, and then renders the AI's suggestions as a series of cards.
    - Each suggestion card has an "Apply Category" button which triggers a call to the existing `/api/entities/bulk-actions` endpoint to efficiently update the `type` for all entities in the group.
- **Integration**: Added an "AI Categorizer" button to the "Tools" menu in `EntityHub.tsx` to launch the new modal. The hub is configured to automatically refresh its data after categories are successfully applied.
---

### Update #15: Temporal Relationships

**Details:**
Added a temporal dimension to the AI's structured memory. Entity relationships can now have optional `startDate` and `endDate` properties, allowing the AI to understand time-bound connections (e.g., "John `worked_at` Acme Corp `from 2020 to 2023`").

**Modified Files:**
- `UpdateTrack.md`
- `scripts/create-tables.js`
- `lib/types/data.ts`
- `app/api/entities/relationships/route.ts`
- `components/hubs/RelationshipGraph.tsx`

**Changes Made:**
- **Database**: Added `startDate` and `endDate` columns to the `entity_relationships` table.
- **Backend**: Updated the relationship API endpoints to accept and return these new optional date fields.
- **Frontend**: The `RelationshipGraph` component was updated to display the start and end dates on the relationship edges, making the graph visually time-aware.
- **Types**: Updated the `EntityRelationship` and `GraphEdge` types to include the optional date properties.
---

### Update #16: Entity "Decay" & Relevancy Scoring

**Details:**
Implemented a dynamic "Relevancy Score" for entities, making the AI's memory more human-like. The score is calculated on-the-fly based on how frequently and recently an entity has been accessed. This is visualized in the Entity Hub with a new sortable "Relevancy" column. Additionally, a "Prune Unused" tool has been added to help clean up orphaned entities that have never been used.

**Modified Files:**
- `UpdateTrack.md`
- `components/hubs/EntityHub.tsx`
- `components/hubs/EntityDetailPanel.tsx`
- `app/api/entities/unused/route.ts` (new file)
- `components/hubs/PruneUnusedModal.tsx` (new file)

**Changes Made:**
- **`EntityHub.tsx`**: Implemented the client-side logic to calculate a relevancy score for each entity. Added a new sortable "Relevancy" column that displays the score as a percentage and a colored progress bar. Integrated the new "Prune Unused" tool into the "Tools" menu.
- **`EntityDetailPanel.tsx`**: Updated to display the new relevancy score with a visual progress bar.
- **`app/api/entities/unused/route.ts`**: Created a new backend endpoint that specifically queries for entities that have no relationships and have never been mentioned in a message.
- **`components/hubs/PruneUnusedModal.tsx`**: Created a new modal component that fetches the list of unused entities from the new API, allows the user to select them, and performs a bulk deletion via the existing bulk actions API.