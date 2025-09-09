
# Task 4-1: Refactor Chat Endpoint

**Related Feature:** `V2 [API] - Refactor /api/chat Endpoint`

---

### 1. Objective
To rewrite the `POST /api/chat` endpoint to delegate all of its business logic to the new `ContextAssemblyPipeline` and `LLMProvider`.

### 2. Scope of Work
- Open `app/api/chat/route.ts`.
- Remove all existing logic for context assembly (fetching from entities, Pinecone, etc.).
- In its place, add code to instantiate and run the `ContextAssemblyPipeline`.
- Use the context returned by the pipeline to construct the final prompt for the `LLMProvider`.
- Call the `LLMProvider` to get the AI response.
- Return the response to the client.

### 3. Files to be Modified/Created
- `app/api/chat/route.ts` (modified)

### 4. Acceptance Criteria
- [ ] The `/api/chat` endpoint no longer contains direct database or Pinecone query logic.
- [ ] The endpoint successfully uses the `ContextAssemblyPipeline` to build context.
- [ ] The chat functionality in the UI continues to work as expected, now powered by the new core engine.
