
# Task 4-4: Create Memory Viewer API

**Related Feature:** `V2 [API] - Memory Viewer Endpoints`

---

### 1. Objective
To build new read-only API endpoints that allow the UI to inspect the raw contents of each memory module for debugging and management purposes.

### 2. Scope of Work
- Create a new API route file, e.g., `app/api/memory-viewer/[module]/route.ts`.
- The `[module]` dynamic parameter will correspond to a memory type (e.g., 'episodic', 'semantic', 'structured').
- Implement a `GET` handler that uses a `switch` statement on the `module` parameter.
- For each case, the handler will instantiate the corresponding memory module from the core engine (e.g., `EpisodicMemoryModule`).
- It will then call the module's `query()` method with appropriate parameters (e.g., pagination, search terms from query params) and return the raw data.

### 3. Files to be Modified/Created
- `app/api/memory-viewer/[module]/route.ts` (created)

### 4. Acceptance Criteria
- [ ] A `GET` request to `/api/memory-viewer/structured` returns a list of entities.
- [ ] A `GET` request to `/api/memory-viewer/episodic?conversationId=...` returns messages for that conversation.
- [ ] The API provides a way to inspect the contents of all major memory modules.
