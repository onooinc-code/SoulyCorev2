# HedraCore Development Guide & Project Index

**Version:** 0.3.0
**Status:** Live (Reflects Cognitive Architecture v2.0)

---

## 1. Project Vision: The Total Recall Companion

**HedraCore** is a next-generation, AI-powered assistant built on the foundational principle of a persistent, intelligent, and multi-faceted memory. It functions as a true **Total Recall Companion**, actively learning from every interaction by leveraging a decoupled, modular Core Engine to manage its long-term memory and cognitive functions.

It is built for a single power user who requires an AI partner that not only answers questions but also retains context, manages complex information, and proactively assists in sophisticated workflows through a secure, cloud-native, and highly configurable platform.

---

## 2. Development Workflow & Protocols

Adherence to these guidelines is **mandatory** for all development work, whether performed by a human or an AI agent. This ensures consistency, maintainability, and a high-quality development process.

### Step 1: Context Assembly (Start of Every Session)
Before initiating any task, a full understanding of the project's current state must be established.
- **Mandatory Reading:** The developer/agent must begin by reading and processing the core documentation files located in the `Docs/` directory, especially `01_System_Architecture.md` and this `README.md`.
- **Code Review:** The agent must review the contents of `components/providers/AppProvider.tsx` and `app/api/chat/route.ts` to understand current implementation patterns.

### Step 2: Feature Management
No feature implementation should begin without following this structured planning process.
1.  **Discussion & Proposal:** A new feature is proposed by the user. The agent's role is to discuss requirements and clarify ambiguities.
2.  **Formal Registration:** Once defined, the feature **MUST** be added to the project's official feature registry by adding a new entry to `scripts/seed-features.js` with a status of `⚪ Planned`.
3.  **Approval:** The agent must wait for explicit user approval before proceeding with implementation.

### Step 3: Implementation & Versioning
Once a feature is approved, the following process must be followed:
1.  **Code Implementation:** Write the necessary code, adhering to all existing patterns.
2.  **Update Feature Status:** Upon completion, update the status of the feature in `scripts/seed-features.js` to `✅ Completed`.
3.  **Update Version:**
    *   Increment the `version` field in `package.json` (e.g., `0.2.0` -> `0.3.0`).
    *   Add a new entry to `scripts/seed-version-history.js` detailing the changes.

### Step 4: Response Protocol
All responses containing code changes must adhere to the following two-part structure:
1.  **Immediate Response (`<changes>` XML):** The first response must **ONLY** contain the XML block with the file changes. No additional text or explanation.
2.  **Detailed Report (`ResponseTemplate-X.html`):** The agent will then generate a new, sequentially numbered HTML report file (e.g., `Docs/Res/ResponseTemplate-6.html`). This file will contain a detailed, user-friendly explanation of the changes, technical decisions, and any relevant diagrams or examples.

---

## 3. Project File Index

This index provides an overview of the key directories and their purpose.

### `/app`
*The core of the Next.js application, using the App Router.*
- **`/api`**: All backend API endpoints (server-side logic). These are lightweight wrappers that call the Core Engine.
- **`layout.tsx`**: The root layout for the entire application.
- **`page.tsx`**: The main entry point component for the application.
- **`globals.css`**: Global styles and Tailwind CSS definitions.

### `/components`
*All React UI components that make up the application's frontend.*
- **`/providers`**: React Context providers for global state management (`AppProvider.tsx`, `LogProvider.tsx`).
- **`/dashboard`**, **`/dev_center`**, **`/brain_center`**: Components for the major UI hubs.
- **`App.tsx`**: The root client-side component, orchestrating all UI views and modals.
- **`ChatWindow.tsx`**: The main chat interface.
- **`Header.tsx`**: The header bar for the chat view.
- **`Message.tsx`**: Renders a single chat message.
- **`NavigationRail.tsx`**: The new primary vertical navigation bar.
- **`ConversationPanel.tsx`**: The new collapsible panel for listing conversations.

### `/core`
* **The Cognitive Engine.** All decoupled, backend-only business logic resides here.*
- **`/llm`**: The LLM Provider Abstraction Layer, which decouples the application from any specific AI SDK.
- **`/memory`**: All Single Memory Module (SMM) implementations (Episodic, Semantic, Structured, Working).
- **`/pipelines`**: The high-level orchestrators (`ContextAssemblyPipeline`, `MemoryExtractionPipeline`) that coordinate actions across memory modules.

### `/Docs`
*All project documentation, feature proposals, and AI-generated response reports.*
- **`00_` to `09_...`**: The official, consolidated system documentation.
- **`/Features-Demo`**: Interactive HTML files used for proposing and demonstrating new feature sets.
- **`/Res`**: Contains all the detailed HTML reports (`ResponseTemplate-X.html`) generated by the AI agent after each code modification.

### `/lib`
*Shared client/server utilities, hooks, and type definitions.*
- **`db.ts`**: Vercel Postgres database connection setup.
- **`gemini-server.ts`**: Legacy Gemini API helper functions (being phased out in favor of the `core/llm` provider).
- **`types.ts`**: Global TypeScript type definitions for database models.

### `/scripts`
*Standalone Node.js scripts for database management.*
- **`create-tables.js`**: The authoritative script for creating the entire database schema.
- **`seed-*.js`**: Scripts for populating the database with initial data (features, API endpoints, version history, etc.).

### Root Files
- **`README.md`**: This file.
- **`package.json`**: Project dependencies and scripts.
- **`next.config.js`**: Configuration for the Next.js framework.