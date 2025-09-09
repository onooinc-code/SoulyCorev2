
# Task 3-2: Implement Memory Extraction Pipeline

**Related Feature:** `V2 [Core] - Memory Extraction Pipeline`

---

### 1. Objective
To build the "Write Path" orchestrator service that analyzes a completed conversation turn and writes new knowledge to the appropriate long-term memory modules.

### 2. Scope of Work
- Create `core/pipelines/memory_extraction.ts`.
- Create a `MemoryExtractionPipeline` class or service.
- The main execution method will accept a user prompt and an AI response as input.
- It will use the `LLMProvider` with a specific extraction prompt to identify new entities and knowledge chunks from the text.
- It will then call the `store()` method on the `SemanticMemoryModule` to save the new knowledge chunks.
- It will call the `store()` method on the `StructuredMemoryModule` to save the new entities.

### 3. Files to be Modified/Created
- `core/pipelines/memory_extraction.ts` (created)

### 4. Acceptance Criteria
- [ ] The `MemoryExtractionPipeline` is created.
- [ ] The pipeline successfully uses the LLM to extract structured data from unstructured text.
- [ ] The pipeline correctly calls the `store()` method on both the `SemanticMemoryModule` and `StructuredMemoryModule` with the extracted data.
