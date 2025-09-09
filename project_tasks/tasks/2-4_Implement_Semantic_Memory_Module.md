
# Task 2-4: Implement Semantic Memory Module

**Related Feature:** `V2 [Core] - Semantic Memory Module`

---

### 1. Objective
To encapsulate all logic related to Pinecone vector database interactions into a new `SemanticMemoryModule` that implements the SMM interface.

### 2. Scope of Work
- Create `core/memory/modules/semantic.ts`.
- Create a `SemanticMemoryModule` class that implements the `ISingleMemoryModule` interface.
- Move the Pinecone client initialization and query logic from `lib/pinecone.ts` and `app/api/chat/route.ts` into the new module.
- The `query()` method will take a text string, generate an embedding using the LLM provider, and perform a similarity search in Pinecone, returning the top K results.
- The `store()` method will take a text chunk, generate an embedding, and upsert the new vector into Pinecone.

### 3. Files to be Modified/Created
- `core/memory/modules/semantic.ts` (created)
- `lib/pinecone.ts` (will be deprecated)

### 4. Acceptance Criteria
- [ ] The `SemanticMemoryModule` class is created and implements the `ISingleMemoryModule` interface.
- [ ] The `query()` method successfully returns relevant documents from Pinecone for a given text query.
- [ ] The `store()` method successfully adds a new document and its vector to the Pinecone index.
