
# SoulyCore Cognitive Architecture v2.0: Implemented Technical Strategy

**Document Version:** 1.0
**Status:** Implemented

---

### 1. Technology Stack

The v2 architecture leverages a modern, scalable, and managed technology stack to minimize operational overhead and maximize performance.

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS | Existing, proven stack. Excellent performance and developer experience. |
| **Backend/API** | Next.js API Routes | Co-located with the frontend for simplicity and seamless data fetching. |
| **Core Engine** | TypeScript, Node.js | Provides type safety and leverages the Vercel serverless environment. |
| **Episodic Memory** | Vercel Postgres | Reliable, managed SQL for storing chronological conversation history. |
| **Semantic Memory** | Pinecone | Industry-leading, high-performance vector database for semantic search. |
| **Structured Memory**| Vercel Postgres | Ideal for schema-enforced data like contacts, entities, and tools. |
| **Working Memory** | Vercel KV (Redis) | High-speed, ephemeral key-value store perfect for temporary context assembly. |
| **AI Models** | Google Gemini API (`@google/genai`) | Primary provider for generation and extraction tasks. |

### 2. Model & Provider Abstraction

To ensure long-term flexibility and avoid vendor lock-in, all interactions with AI models are routed through an abstraction layer.

*   **Strategy:** An adapter pattern has been implemented.
*   **Implementation:**
    1.  A generic `ILLMProvider` interface is defined in `src/core/llm/types.ts`.
    2.  A concrete implementation, `GeminiProvider`, implements this interface and contains the specific logic for calling the `@google/genai` SDK.
    3.  All other parts of the Core Engine only interact with the `ILLMProvider` interface, allowing for easy extension with other model providers in the future.

### 3. Storage Strategy

This table maps the conceptual memory modules from the Cognitive Model to their implemented storage technologies.

| Memory Module | Storage Technology | Primary Table(s) / Index | Rationale |
| :--- | :--- | :--- | :--- |
| **Episodic** | Vercel Postgres | `conversations`, `messages` | SQL provides strong transactional integrity for chronological, relational data. |
| **Semantic** | Pinecone | `soul-knowledgebase` | Optimized for low-latency, high-throughput vector similarity search. |
| **Structured**| Vercel Postgres | `contacts`, `entities` | The relational nature of SQL is perfect for structured, user-managed data. |
| **Procedural**| Vercel Postgres | `tools`, `workflows` | (Future) Storing tool schemas and workflow definitions in SQL allows for easy management. |
| **Working** | Vercel KV (Redis) | `session:[sessionId]` | Extremely fast reads/writes for ephemeral data needed during a single API request. |

### 4. Quality Assurance & Testing Strategy

A robust QA process has been integrated into the `DevCenter`.

*   **Feature Health Dashboard:** A new tab in the Dev Center displays the health status of all system components.
*   **Test Case Registry:** The `feature_tests` database table stores detailed test cases linked to features. Each entry contains a description, manual steps, expected results, and the last run status.
*   **Manual Test Execution:** The Feature Health Dashboard includes a UI to view test cases, execute them manually, and record the results (`Passed`/`Failed`). This provides an at-a-glance view of the application's stability.
