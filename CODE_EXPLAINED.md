
# SoulyCore: Codebase Encyclopedia & Technical Reference

**Version:** 0.5.14
**Last Updated:** December 2025

This document serves as the comprehensive technical guide to the SoulyCore codebase. It explains the directory structure, the role of key files, the architectural logic, and the data flow within the system.

---

## 1. High-Level Architecture

SoulyCore follows a **Server-Centric Modular Architecture** built on Next.js 14 (App Router).

1.  **Presentation Layer (Frontend):** React components acting as a client for the backend. Uses Context API for state management.
2.  **Gateway Layer (API Routes):** Next.js API Routes (`/app/api`) that validate requests and route them to the Core Engine.
3.  **Logic Layer (Core Engine):** The brain of the system (`/core`). Contains business logic, pipelines, and agents. It is decoupled from the UI.
4.  **Persistence Layer (Memory):** A unified abstraction over multiple databases (Postgres, Pinecone, EdgeDB, KV).

---

## 2. Directory Structure Deep Dive

### `/app` (The Next.js Application)
This directory handles routing and API endpoints.

*   **`layout.tsx`**: The root layout. Defines global font, theme providers, and structure.
*   **`page.tsx`**: The entry point. Initializes global providers (`LogProvider`, `ConversationProvider`) and renders the main `App` component.
*   **`/api`**: Contains all backend endpoints.
    *   **`/chat`**: The critical endpoint. Receives user messages, runs the `ContextAssemblyPipeline`, generates AI response, and triggers `MemoryExtraction`.
    *   **`/agents`**: Endpoints for planning and executing autonomous agent runs.
    *   **`/entities`**: CRUD operations for the Knowledge Graph (Structured Memory).
    *   **`/memory`**: Endpoints to manually trigger extraction pipelines or query memory.
    *   **`/version`**: Endpoints to fetch the current system version and changelog.

### `/core` (The Cognitive Engine)
This is the most critical directory. It contains the AI logic, independent of the UI.

#### `/core/pipelines` (The Orchestrators)
Pipelines coordinate multiple memory modules and LLM calls to perform complex cognitive tasks.
*   **`context_assembly.ts` (Read Path):**
    *   **Goal:** Construct the "System Prompt" for the AI.
    *   **Logic:** Fetches recent chat history (Episodic), queries Pinecone for relevant facts (Semantic), and looks up entity details (Structured). Merges them into a context block.
*   **`memory_extraction.ts` (Write Path):**
    *   **Goal:** Learn from conversations.
    *   **Logic:** Runs in the background. Analyzes the last turn, extracts Entities, Relationships, and Facts, and saves them to their respective databases (Postgres, EdgeDB, Pinecone).
*   **`link_prediction.ts`:**
    *   **Goal:** Proactive Graph Building.
    *   **Logic:** Analyzes entities mentioned together frequently and suggests new relationships between them.

#### `/core/memory` (The Abstraction Layer)
Standardizes access to different database technologies.
*   **`modules/episodic.ts`**: Wrapper for Postgres `messages` table. Handles chat history.
*   **`modules/semantic.ts`**: Wrapper for Pinecone. Handles vector embeddings and similarity search.
*   **`modules/structured.ts`**: Wrapper for Postgres `entity_definitions`. Handles explicit data.
*   **`modules/graph.ts`**: Wrapper for EdgeDB (conceptually). Handles complex relationships.

#### `/core/agents` (Autonomous Systems)
*   **`autonomous_agent.ts`**: Implementation of the Agentic Workflow.
    *   **Logic:** Takes a Goal -> Generates a Plan -> Loops through (Thought -> Action -> Observation) until the goal is met.

#### `/core/llm` (AI Provider)
*   **`providers/gemini.ts`**: The implementation using Google's `gemini-1.5-pro` and `flash` models. Handles API keys and retries.

### `/components` (The User Interface)
*   **`App.tsx`**: The main layout orchestrator. Manages the Sidebar, Header, and Active View.
*   **`/providers`**:
    *   **`ConversationProvider`**: Manages chat state, message lists, and sending logic.
    *   **`UIStateProvider`**: Manages which "View" (Chat, Dashboard, Brain Center) is currently active.
*   **`/chat`**:
    *   **`ChatWindow.tsx`**: The main chat container.
    *   **`MessageList.tsx`**: Renders the stream of messages.
    *   **`ChatInput.tsx`**: The complex input area with macros and file upload support.
*   **`/hubs`**: Specialized dashboards.
    *   **`EntityHub.tsx`**: UI for managing the Knowledge Graph.
    *   **`MemoryExtractionHub.tsx`**: UI for manually running extraction tools.
*   **`/dev_center`**: Tools for developers (API testing, health checks).

### `/lib` (Utilities & Configuration)
*   **`db.ts`**: Postgres connection pool configuration.
*   **`pinecone.ts`**: Vector database client configuration.
*   **`gemini-server.ts`**: Server-side helper functions for direct AI calls.
*   **`types.ts`**: TypeScript definitions sharing data models across Frontend and Backend.

### `/scripts` (Database Management)
*   **`create-tables.js`**: Defines the SQL schema. Run this to initialize the database.
*   **`seed-*.js`**: Scripts to populate the database with initial data (Versions, Features, API Endpoints).

---

## 3. Key Data Flows

### A. The "Chat" Flow (Request/Response)
1.  **User** types a message in `ChatInput`.
2.  `ConversationProvider` sends POST to `/api/chat`.
3.  **API Route** instantiates `ContextAssemblyPipeline`.
    *   Pipeline fetches History (Postgres), Facts (Pinecone), Entities (Postgres).
    *   Pipeline constructs the System Prompt.
4.  **API Route** calls `llmProvider.generateContent`.
5.  **API Route** saves the AI response to Postgres (`EpisodicMemory`).
6.  **API Route** triggers `MemoryExtractionPipeline` (Fire-and-forget background task).
7.  **Response** is sent back to `ChatWindow`.

### B. The "Learning" Flow (Extraction)
1.  **Triggered** by `/api/chat` (background) or manually via `MemoryExtractionHub`.
2.  `MemoryExtractionPipeline` analyzes text.
3.  **LLM** extracts JSON: `{ entities: [], facts: [], relationships: [] }`.
4.  Pipeline iterates through results:
    *   **Entities** -> Saved to Postgres `entity_definitions`.
    *   **Facts** -> Embedded & Saved to Pinecone `soul-knowledgebase`.
    *   **Relationships** -> Saved to Postgres `entity_relationships`.

---

## 4. Database Schema Overview

*   **`conversations`**: Metadata (title, model config).
*   **`messages`**: The actual chat logs. Linked to `conversations`.
*   **`entity_definitions`**: The "Nodes" of the knowledge graph (People, Concepts).
*   **`entity_relationships`**: The "Edges" connecting entities (Subject -> Predicate -> Object).
*   **`logs`**: System-wide logs for debugging and observability.
*   **`version_history`**: Tracks app updates and changelogs.

---

## 5. Development Guidelines

1.  **Strict Typing:** Always use types from `@/lib/types`.
2.  **Separation:** Never call the DB directly from a Component. Always go Component -> API -> Lib/Core -> DB.
3.  **Versioning:** When adding features, update `seed-version-history.js`.
4.  **AI Usage:** Use `gemini-3-flash-preview` for fast tasks (chat, extraction) and `gemini-3-pro-preview` for complex reasoning (agents, planning).
