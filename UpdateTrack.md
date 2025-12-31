
... (Existing entries) ...

---

### Update #45: RAG Enhancement & Memory Sync (v0.5.29)

**Details:**
Critical update to the cognitive engine to resolve failures in retrieving entities across different conversations. Implemented Query Expansion to ensure vague user prompts still trigger correct memory lookups.

**Changes Made:**
- **Query Expansion:** Modified `ContextAssemblyPipeline` to use Gemini to generate a dedicated "Search Query" from conversation context before querying memory modules.
- **Vector Sync Fix:** Updated `MemoryExtractionPipeline` to force-update the Upstash Vector store for every entity extracted, ensuring immediate availability for future RAG cycles.
- **RAG Scoring:** Increased retrieval depth to top 5 entities to improve the probability of finding cross-conversation links.
- **Versioning:** Bumped version to `0.5.29`.

**Modified Files:**
- `core/pipelines/context_assembly.ts`
- `core/pipelines/memory_extraction.ts`
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
