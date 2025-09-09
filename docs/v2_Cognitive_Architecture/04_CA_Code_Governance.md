
# SoulyCore Cognitive Architecture v2.0: Code Governance

**Document Version:** 1.2
**Status:** Implemented

---

### 1. Core File Structure

The v2 architecture introduced a new `core/` directory at the project root to house all business logic for the Cognitive Engine, cleanly separating it from the Next.js presentation and API layers.

```
soulycore/
├── app/                        // Next.js App Router (unchanged)
│   ├── api/
│   └── ...
├── components/                 // UI Components (unchanged)
├── core/                       // Core Business Logic
│   ├── llm/                    // LLM Abstraction Layer
│   │   ├── providers/
│   │   │   └── gemini.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── memory/                 // Memory Module Implementations
│   │   ├── modules/
│   │   │   ├── episodic.ts
│   │   │   ├── semantic.ts
│   │   │   ├── structured.ts
│   │   │   └── working.ts
│   │   └── types.ts
│   └── pipelines/              // High-level Orchestrators
│       ├── context_assembly.ts
│       └── memory_extraction.ts
├── docs/
├── lib/                        // Legacy helpers & DB connection (partially deprecated)
└── public/
```

### 2. Deprecation & Migration Strategy

The business logic formerly located in `lib/gemini-server.ts`, `lib/pinecone.ts`, and within the primary API routes is now considered **DEPRECATED**. The migration to the new Core Engine has been completed.

1.  **Core Services Built:** The `core/` directory has been fully implemented with its own modules, pipelines, and types.
2.  **API Routes Refactored:** Existing API routes in `app/api/` (e.g., `app/api/chat/route.ts`) have been updated to be lightweight wrappers that call the new, corresponding services from the `core/` directory.
3.  **Legacy Code Decommissioned:** The old, monolithic business logic has been removed from the API routes. Some helpers may remain in `lib/` but are slated for eventual removal.

### 3. TypeScript Policy

Strictness and clarity are mandatory for the core engine.

*   **Strict Mode:** The project's `tsconfig.json` enforces `"strict": true`.
*   **No Implicit `any`:** The `"noImplicitAny": true` rule is strictly enforced.
*   **Centralized Types:** All shared types and interfaces for the Cognitive Engine are defined in `core/memory/types.ts` and `core/llm/types.ts`.
*   **Naming Conventions:**
    *   Interfaces and Types: `PascalCase` (e.g., `interface IBrain`).
    *   Functions, Variables, and Methods: `camelCase` (e.g., `function assembleContext()`).
*   **JSDoc Comments:** All exported functions and class methods within the `core/` directory are preceded by JSDoc blocks explaining their purpose, parameters (`@param`), and return value (`@returns`).

### 4. Error Handling Protocol

Standardized error handling is critical for a robust backend.

1.  **Service-Level Throwing:** Core services (`core/`) **throw** standard `Error` objects when an operation fails. They do not silently handle errors and return `null`.
2.  **API-Level Catching:** The API route handlers in `app/api/` are responsible for wrapping all calls to core services in `try...catch` blocks.
3.  **Standardized Response:** When an error is caught, the API route logs the full error internally and returns a standardized JSON error response to the client with a relevant HTTP status code and detailed error message. Example:
    ```json
    {
      "error": "Internal Server Error",
      "details": {
        "message": "Failed to retrieve data from semantic memory."
      }
    }
    ```
