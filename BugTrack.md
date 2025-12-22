
# Bug Tracking Log
... (Previous entries) ...

---
### Bug #40: Identity Persistence & Duplicate History

**Error Details:**
1. AI failed to remember its name (Souly) or user details (Hadra) despite verbal confirmation.
2. The `Cognitive Process Inspector` showed duplicate user messages in the `history` parts.
3. Extraction was purely manual and failed to parse Arabic identity facts.

**Solution:**
1. Deduplicated history logic in `ContextAssemblyPipeline`.
2. Automated the `MemoryExtractionPipeline` call in the chat route for background "Auto-Sync".
3. Enhanced the extraction prompt with explicit instructions for Arabic and identity differentiation.
4. Added `aiName` and `role` fields to `ProfileMemoryModule`.

**Modified Files:**
- `core/pipelines/context_assembly.ts`
- `core/pipelines/memory_extraction.ts`
- `core/memory/modules/profile.ts`
- `app/api/chat/route.ts`
- `app/api/version/current/route.ts`
