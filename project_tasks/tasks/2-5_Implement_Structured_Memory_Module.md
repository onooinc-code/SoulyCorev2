
# Task 2-5: Implement Structured Memory Module

**Related Feature:** `V2 [Core] - Structured Memory Module`

---

### 1. Objective
To refactor the existing logic for handling structured data (entities and contacts) into a new, unified `StructuredMemoryModule` that implements the SMM interface.

### 2. Scope of Work
- Create `core/memory/modules/structured.ts`.
- Create a `StructuredMemoryModule` class that implements the `ISingleMemoryModule` interface.
- Consolidate the database query logic from `app/api/entities/route.ts` and `app/api/contacts/route.ts` into this module.
- The `query()` method will accept a name or ID and retrieve the corresponding entity or contact from the database.
- The `store()` method will handle the creation and updating (upserting) of entities and contacts in the database.

### 3. Files to be Modified/Created
- `core/memory/modules/structured.ts` (created)

### 4. Acceptance Criteria
- [ ] The `StructuredMemoryModule` class is created and implements the `ISingleMemoryModule` interface.
- [ ] The module can successfully fetch entities and contacts from the database.
- [ ] The module can successfully save new or updated entities and contacts to the database.
