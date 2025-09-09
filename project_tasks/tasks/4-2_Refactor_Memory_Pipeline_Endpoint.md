
# Task 4-2: Refactor Memory Pipeline Endpoint

**Related Feature:** `V2 [API] - Refactor /api/memory/pipeline Endpoint`

---

### 1. Objective
To rewrite the `POST /api/memory/pipeline` endpoint to delegate its logic entirely to the new `MemoryExtractionPipeline`.

### 2. Scope of Work
- Open `app/api/memory/pipeline/route.ts`.
- Remove all existing logic for data extraction and saving to various memory stores.
- Add code to instantiate and run the `MemoryExtractionPipeline`, passing it the `textToAnalyze` from the request body.
- The endpoint should now be a simple, lightweight wrapper around the core pipeline service.

### 3. Files to be Modified/Created
- `app/api/memory/pipeline/route.ts` (modified)

### 4. Acceptance Criteria
- [ ] The `/api/memory/pipeline` endpoint no longer contains direct data extraction logic.
- [ ] The endpoint successfully invokes the `MemoryExtractionPipeline`.
- [ ] The application continues to learn from conversations, with the new pipeline handling the memory updates.
