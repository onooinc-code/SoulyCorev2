
# Task 2-1: Implement LLM Provider Abstraction

**Related Feature:** `V2 [Core] - LLM Provider Abstraction Layer`

---

### 1. Objective
To create a generic abstraction layer for interacting with Large Language Models, decoupling the core engine from the specific Google GenAI SDK.

### 2. Scope of Work
- Create `core/llm/types.ts` and define a generic `ILLMProvider` interface with methods like `generateContent(..)` and `generateEmbedding(..)`.
- Create `core/llm/providers/gemini.ts`.
- Inside `gemini.ts`, create a `GeminiProvider` class that implements the `ILLMProvider` interface.
- Move the existing Gemini SDK initialization and call logic from `lib/gemini-server.ts` into the methods of the `GeminiProvider` class.
- Create an `core/llm/index.ts` file that exports a factory function to instantiate and return the configured `GeminiProvider`.

### 3. Files to be Modified/Created
- `core/llm/types.ts` (created)
- `core/llm/providers/gemini.ts` (created)
- `core/llm/index.ts` (created)
- `lib/gemini-server.ts` (will be modified to remove logic, eventually deprecated)

### 4. Acceptance Criteria
- [ ] The `ILLMProvider` interface is defined in `core/llm/types.ts`.
- [ ] The `GeminiProvider` class in `core/llm/providers/gemini.ts` correctly implements the interface.
- [ ] The core engine can successfully make a call to the Gemini API through the new abstraction layer.
