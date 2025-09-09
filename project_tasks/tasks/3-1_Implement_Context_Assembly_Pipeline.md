
# Task 3-1: Implement Context Assembly Pipeline

**Related Feature:** `V2 [Core] - Context Assembly Pipeline`

---

### 1. Objective
To build the "Read Path" orchestrator service that intelligently queries all relevant memory modules to construct the final, optimized prompt context.

### 2. Scope of Work
- Create `core/pipelines/context_assembly.ts`.
- Create a `ContextAssemblyPipeline` class or service.
- The main execution method of this service will:
  - Instantiate and use the `EpisodicMemoryModule` to get recent messages.
  - Instantiate and use the `SemanticMemoryModule` to get relevant knowledge.
  - Instantiate and use the `StructuredMemoryModule` to get entity details.
  - Combine the results from all modules into a single, coherent context string.
  - Write the final context to the `WorkingMemoryModule` for temporary storage during the API call.
  - Return the assembled context.

### 3. Files to be Modified/Created
- `core/pipelines/context_assembly.ts` (created)

### 4. Acceptance Criteria
- [ ] The `ContextAssemblyPipeline` is created.
- [ ] The pipeline successfully calls the `query()` method of at least three different memory modules.
- [ ] The pipeline correctly aggregates the results into a single string.
- [ ] The final context is successfully stored in the `WorkingMemoryModule`.
