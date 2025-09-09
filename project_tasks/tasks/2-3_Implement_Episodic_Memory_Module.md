
# Task 2-3: Implement Episodic Memory Module

**Related Feature:** `V2 [Core] - Episodic Memory Module`

---

### 1. Objective
To refactor the existing logic for managing conversation history into a new, self-contained `EpisodicMemoryModule` that implements the standard SMM interface.

### 2. Scope of Work
- Create `core/memory/modules/episodic.ts`.
- Create an `EpisodicMemoryModule` class that implements the `ISingleMemoryModule` interface.
- Move the database query logic for fetching messages from `app/api/conversations/[conversationId]/messages/route.ts` into the `query()` method of the new module.
- The `query()` method should accept parameters like `conversationId` and `messageCount` to retrieve a specific slice of history.
- The `store()` method will handle writing new messages to the `messages` table.

### 3. Files to be Modified/Created
- `core/memory/modules/episodic.ts` (created)

### 4. Acceptance Criteria
- [ ] The `EpisodicMemoryModule` class is created and implements the `ISingleMemoryModule` interface.
- [ ] The `query()` method can successfully fetch the last N messages for a given conversation from the database.
- [ ] The `store()` method can successfully save a new message to the database.
