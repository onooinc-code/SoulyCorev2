
# Task 2-2: Implement Working Memory Module

**Related Feature:** `V2 [Core] - Working Memory Module`

---

### 1. Objective
To build a new, high-speed memory module for temporary data storage using Vercel KV (Redis), adhering to the SMM interface.

### 2. Scope of Work
- Create `core/memory/modules/working.ts`.
- Create a `WorkingMemoryModule` class that implements the `ISingleMemoryModule` interface.
- Use the `@vercel/kv` package to connect to the Vercel KV store.
- Implement the `store()` method to write data (like assembled prompt context) to a Redis key with a short Time-To-Live (TTL), e.g., 5 minutes.
- Implement the `query()` method to retrieve data from a Redis key.

### 3. Files to be Modified/Created
- `core/memory/modules/working.ts` (created)

### 4. Acceptance Criteria
- [ ] The `WorkingMemoryModule` class is created and implements the `ISingleMemoryModule` interface.
- [ ] The module can successfully connect to the Vercel KV store.
- [ ] The module can write data to a key and read it back before the TTL expires.
- [ ] Data written to a key is automatically deleted after the TTL expires.
