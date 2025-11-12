# SoulyCore: The Definitive Developer's Guide

**Version:** 0.4.1
**Status:** Live (Reflects Cognitive Architecture v2.0)

---

## Table of Contents

1.  [Project Vision: The Total Recall Companion](#1-project-vision-the-total-recall-companion)
2.  [System Architecture](#2-system-architecture)
3.  [Technology Stack & Environment](#3-technology-stack--environment)
4.  [Project Structure Deep Dive](#4-project-structure-deep-dive)
5.  [Feature Registry & Hubs Deep Dive](#5-feature-registry--hubs-deep-dive)
6.  [Development Workflow & Rules](#6-development-workflow--rules)
7.  [Future Roadmap & Important Notes](#7-future-roadmap--important-notes)

---

## 1. Project Vision: The Total Recall Companion

**SoulyCore** is a next-generation, AI-powered assistant built for a single power user. Its foundational principle is a persistent, intelligent, and multi-faceted memory. It functions as a true **Total Recall Companion**, actively learning from every interaction to become an indispensable partner for managing complex information and executing sophisticated workflows through a secure, cloud-native, and highly configurable platform.

---

## 2. System Architecture

SoulyCore uses a modern, server-centric architecture where the frontend UI acts as a client to a powerful backend Core Engine. This ensures a clean separation of concerns and enhances security.

```mermaid
graph TD
    subgraph Browser
        A[Frontend UI - Next.js/React]
    end

    subgraph "Vercel Serverless Backend"
        B[Next.js API Routes]
        C[Core Engine (core/)]
    end

    subgraph "Core Engine"
        subgraph C
            D[Context Assembly Pipeline]
            E[Memory Extraction Pipeline]
            F[LLM Provider Abstraction]
            G[Autonomous Agent]
        end
    end
    
    subgraph "Data Stores & Memory Modules"
        H[Episodic Memory - Vercel Postgres]
        I[Semantic Memory - Pinecone]
        J[Structured Memory - Vercel Postgres]
        K[Working Memory - Vercel KV]
    end

    subgraph "External Services"
        L[Google Gemini API]
    end

    A -- HTTP Request --> B
    B -- Calls --> C
    C -- Manages --> D, E, & G
    D -- "Reads from (Read Path)" --> H & I & J
    E -- "Writes to (Write Path)" --> H & I & J
    F -- "Communicates with" --> L
    C -- "Uses" --> F
    D -- "Caches context in" --> K
```

---

## 3. Technology Stack & Environment

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI & Animation:** React, Framer Motion
- **AI Model:** Google Gemini API (`@google/genai`)
- **Episodic & Structured Memory:** Vercel Postgres
- **Semantic Memory (Vectors):** Pinecone
- **Working Memory (Cache):** Vercel KV (Redis)
- **Deployment Platform:** Vercel

---

## 4. Project Structure Deep Dive

- **`/app`**: The core of the Next.js application.
  - **`/api`**: All backend API endpoints. These are lightweight wrappers that call the Core Engine.
- **`/components`**: All React UI components.
  - **`/providers`**: Global state management using React Context (`ConversationProvider`, `UIStateProvider`, etc.).
  - **`/dashboard`, `/agent_center`, `/brain_center`, etc.**: Components for the major UI hubs.
- **`/core`**: **The Cognitive Engine.** All decoupled, backend-only business logic resides here.
  - **`/agents`**: Contains the logic for the `AutonomousAgent`.
  - **`/llm`**: The LLM Provider Abstraction Layer, which decouples the application from any specific AI SDK.
  - **`/memory`**: All Single Memory Module (SMM) implementations (Episodic, Semantic, etc.).
  - **`/pipelines`**: The high-level orchestrators (`ContextAssemblyPipeline`, `MemoryExtractionPipeline`).
  - **`/tools`**: Implementations of agent-usable tools like `web_search`.
- **`/reports`**: Contains HTML templates and saved reports, viewable through the Reports Hub.
- **`/lib`**: Shared utilities, hooks, and global type definitions.
- **`/scripts`**: Standalone Node.js scripts for database management (`create-tables.js`, `seed-*.js`).
- **`PROJECT_GUIDE.md`**: This file. The single source of truth for all project documentation.

---

## 5. Feature Registry & Hubs Deep Dive

This section details all major user-facing hubs and their implemented features.

### 5.1. Dashboard Center (`/components/dashboard`)
The main landing page and high-level command center for the application.
- **Header Panel**: Displays the application's branding.
- **Hedra Goals Panel**: Manages and displays the project's strategic goals and subsystems.
- **Stats Panel**: Visualizes system-wide statistics with interactive charts powered by Nivo.
- **Documentation Panel**: Provides quick access to view and edit project documentation.
- **Actions, Decisions, Reports Panels**: Centralized locations for system-wide actions, user decisions, and generated reports.

### 5.2. Autonomous Agent Center (`/components/agent_center`)
A hub for defining high-level goals and launching autonomous agents to achieve them.
- **Goal Definition**: A UI for inputting complex, multi-step goals.
- **Plan Generation & Review**: The agent first generates a high-level plan, which the user must approve before execution.
- **Live Execution Report**: A real-time monitor showing the agent's thought process, actions, and observations for each step.
- **Run History**: A persistent list of all previous and ongoing agent runs.

### 5.3. Brain Center (`/components/brain_center`)
The central management hub for the AI's cognitive architecture.
- **Brain Management**: A full CRUD interface for creating and configuring different "Brains" (e.g., "Work Brain", "Personal Brain").
- **Memory Viewer**: An inspection tool to view the raw data within each memory module (Episodic, Semantic, Structured).

### 5.4. Memory Center (`/components/MemoryCenter.tsx`)
Manages the AI's **Structured Memory** (explicit facts).
- **Entity Management**: A full CRUD interface for managing entities (people, projects, concepts) stored in the Postgres database.
- **Visual Relationship Graph**: An interactive graph to display and explore entity relationships. See section 5.14 for details.
- **Segment Hub**: A UI to manage `Segments` (like Topics or Impact levels) for categorizing messages.
- **Predicates Hub**: A CRUD interface for defining the types of relationships (e.g., `works_for`, `is_located_in`) that can exist between entities.
- **Validation Rules Hub**: A UI to define validation logic for different entity types, ensuring data consistency.

### 5.5. Contacts Hub (`/components/ContactsHub.tsx`)
A specialized part of Structured Memory for managing people and organizations.
- **Contact Management**: A full CRUD interface for contacts.
- **@Mention Integration**: Contacts can be mentioned in the chat input to provide specific context to the AI.

### 5.6. Prompts Hub (`/components/PromptsHub.tsx`)
A system for creating, managing, and using reusable prompt templates.
- **Prompt Management**: A two-panel CRUD interface for organizing prompts into folders and tags.
- **Dynamic Variables**: Supports `{{variable}}` placeholders that trigger a modal for user input.
- **Workflow Builder**: A UI to create multi-step prompt chains where the output of one step can be the input for another.

### 5.7. Tools Hub (`/components/ToolsHub.tsx`)
The interface for managing **Procedural Memory** (the agent's capabilities).
- **Tool Registry**: A CRUD interface to define tools the agent can use.
- **Schema Definition**: Each tool requires a Gemini-compatible JSON Schema that defines its inputs.

### 5.8. Projects Hub (`/components/ProjectsHub.tsx`)
A hub to manage projects and their associated tasks, replacing the simple `Tasks Hub`.
- **Project Management**: Full CRUD for projects.
- **Task Management**: Full CRUD for tasks within each project.
- **AI Summarization**: On-demand AI-powered summaries of a project's status based on its tasks.

### 5.9. Memory Extraction Hub (`/components/hubs/MemoryExtractionHub.tsx`)
A dedicated workspace for turning unstructured data into structured knowledge.
- **Multi-Source Extraction**: Provides tools to extract entities, knowledge, and relationships from various sources:
  - **AI-Contact Conversations**: Analyzes full conversation histories.
  - **Contact-Contact Chat**: Analyzes pasted chat logs from external sources.
  - **Documents**: Analyzes uploaded text or markdown files.
- **Interactive Review**: Presents the AI's extracted information in an editable format, allowing the user to review, modify, and select which items to save to the AI's long-term memory.

### 5.10. Contextual Analyzer Hub (`/components/hubs/ContextualAnalyzer.tsx`)
An on-demand text analysis tool that acts like an integrated "find" feature for the AI's memory.
- **Text Input**: Users can paste any block of text (e.g., an email, an article).
- **Entity Highlighting**: The system scans the text and automatically highlights any names or terms that match entities already stored in its memory.
- **Context on Hover**: Hovering over a highlighted entity reveals its description, providing instant context without leaving the page.

### 5.11. Experiences Hub (`/components/hubs/ExperiencesHub.tsx`)
A UI to view and manage "Experiences"—generalized plans automatically learned from successful agent runs.

### 5.12. Communication Hub (`/components/hubs/CommunicationHub.tsx`)
Manages external communication channels.
- **Channel Dashboard**: Create and view webhook channels.
- **Unified Inbox**: View incoming messages from all connected channels.
- **Broadcast Manager**: Send notifications to channels.

### 5.13. Data Hub (`/components/data_hub`)
A dashboard for monitoring and managing all connected data sources and storage services.
- **Status Overview**: Displays the real-time status of all connected services (Postgres, Pinecone, KV, etc.).
- **Configuration Management**: Provides modals to test connections and update credentials for each data source.

### 5.14. Visual Relationship Graph (`/components/hubs/RelationshipGraph.tsx`)
Provides a visual, interactive graph to display the relationships between entities stored in structured memory.
- **Node Rendering**: Displays each entity as a draggable node.
- **Edge Rendering**: Shows relationships as labeled, directed edges connecting nodes.
- **Interactivity**: Users can drag nodes to rearrange the graph, and use the mouse wheel to zoom in/out and pan across the canvas for better exploration of complex data.

### 5.15. Reports Hub (`/components/hubs/ReportsHub.tsx`)
A dedicated viewer for HTML templates and saved reports.
- **File Browser**: Lists all available `.html` files from the `/reports` directory.
- **HTML Viewer**: Renders the content of the selected file in an `<iframe>`, allowing for interactive previews of complex reports and templates, including those with Mermaid.js diagrams.

### 5.16. SoulyDev Center (`/components/dev_center`)
An integrated control panel for developers.
- **API Command Center**: A Postman-like interface to test all backend API endpoints directly in the app.
- **Feature Health Dashboard**: A QA hub to display the health status of all system features based on registered test cases.
- **Features Dictionary**: A full CRUD interface for managing the project's feature list.
- **Smart Documentation**: A live, editable viewer for project documentation.

---

## 6. Development Workflow & Rules

Adherence to these guidelines is **mandatory** for all development work. Refer to `DocsV2/09_Development_Workflow.md` for the full protocol.

1.  **Onboarding (Start of Session)**: Before any task, the agent **MUST** review this file (`PROJECT_GUIDE.md`) and key implementation files to understand the current project state.
2.  **Feature Management**: Features must be formally proposed, registered in the database, and approved before implementation.
3.  **Implementation & Versioning**: After coding, the feature status and project version must be updated in the database via the seed scripts (`scripts/seed-features.js`, `scripts/seed-version-history.js`).
4.  **Response Protocol**: Follow the Dual-Response protocol: an XML block with code changes, followed by a detailed HTML report.

---

## 7. Future Roadmap & Important Notes

### Key Unimplemented Features:
- **Advanced Autonomous Agent (ReAct)**: The current agent executes a pre-defined plan. The next major step is to implement a true ReAct (Reason + Act) loop where the agent can choose and use tools from the **Tools Hub** to solve problems dynamically.

### Important Notes:
- The project is designed for a **single power user**. Features related to multi-tenancy or public sharing are out of scope.
- The project follows an **API-First** philosophy. All functionality should be exposed via a backend API, with the UI acting as a client.
- UI should remain consistent. Integrating large, external component libraries is strongly discouraged.
