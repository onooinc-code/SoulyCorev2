
... (Existing entries) ...

---

### Update #46: Cognitive Pipeline & Inspector Fixes (v0.5.42)

**Details:**
Comprehensive fix for the debugging tools and memory feedback loop. The Cognitive Inspector now correctly displays the prompts used, and the Extracted Memory button successfully retrieves the background extraction results.

**Changes Made:**
- **Context Assembly:** Modified `ContextAssemblyPipeline` to persist prompt/system data to `pipeline_runs`.
- **Inspector API:** Updated `api/inspect` to differentiate between Context and Extraction runs.
- **UI:** Updated `MessageFooter` to locate the correct pipeline run for extraction data.
- **Versioning:** Bumped to v0.5.42.

**Modified Files:**
- `core/pipelines/context_assembly.ts`
- `app/api/inspect/[messageId]/route.ts`
- `components/MessageFooter.tsx`
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
