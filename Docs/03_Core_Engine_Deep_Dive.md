# SoulyCore v2: Core Engine Deep Dive

**Document Version:** 2.0
**Status:** Live

---

### 1. Overview

The `core/` directory is the heart of the SoulyCore v2 Cognitive Architecture. It contains all backend business logic, completely decoupled from the Next.js API and frontend layers. This ensures a clean separation of concerns and makes the engine portable and testable.

### 2. Directory Structure

```
core/
├── llm/                    // LLM Abstraction Layer
│   ├── providers/
│   │   └── gemini.ts
│   ├── types.ts
│   └── index.ts
├── memory/                 // Memory Module Implementations
│   ├── modules/
│   │   ├── episodic.ts
│   │   ├── semantic.ts
│   │   ├── structured.ts
│   │   └── working.ts
│   └── types.ts
└── pipelines/              // High-level Orchestrators
    ├── context_assembly.ts
    └── memory_extraction.ts
```

### 3. Key Components

#### 3.1. LLM Provider (`core/llm/`)

This layer uses an adapter pattern to abstract away the specifics of the AI model provider.
- **`types.ts`**: Defines the `ILLMProvider` interface, which mandates methods like `generateContent()` and `generateEmbedding()`.
- **`providers/gemini.ts`**: Contains the `GeminiProvider` class, a concrete implementation of `ILLMProvider` that uses the `@google/genai` SDK.
- **`index.ts`**: Exports a singleton instance of the configured provider (`GeminiProvider`), which the rest of the application uses.

#### 3.2. Single Memory Modules (SMMs) (`core/memory/modules/`)

Each module is a class that implements the `ISingleMemoryModule` interface, providing a standardized way to `query()` and `store()` data.

- **`episodic.ts`**: Manages conversation history in the `messages` table of Vercel Postgres.
- **`semantic.ts`**: Manages knowledge vectors in the Pinecone index. Handles embedding generation and similarity searches.
- **`structured.ts`**: Manages entities and contacts in their respective Vercel Postgres tables.
- **`working.ts`**: Manages ephemeral data in Vercel KV (Redis) with a Time-To-Live (TTL), perfect for caching assembled context during a request.

#### 3.3. Workflow Pipelines (`core/pipelines/`)

These are high-level orchestrators that coordinate actions across multiple SMMs to perform complex cognitive tasks.

- **`context_assembly.ts`**: The "Read Path." Its `assembleContext()` method is called by the `/api/chat` route. It queries the semantic and structured memory modules to build a context string, which it prepends to the user's prompt.
- **`memory_extraction.ts`**: The "Write Path." Its `extractAndStore()` method is called by the `/api/memory/pipeline` route. It uses the LLM to analyze a conversation turn, then calls the `store()` methods of the semantic and structured modules to save the extracted knowledge.