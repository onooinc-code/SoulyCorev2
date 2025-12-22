
... (Existing entries) ...

---

### Update #28: Memory Transparency & Deep Logging (v0.4.16)

**Details:**
Enhanced the observability of the AI's cognitive processes by providing real-time feedback on knowledge extraction and detailed logging of internal pipeline steps.

**Changes Made:**
- **Extracted Knowledge Badge:** Added a new UI element in `MessageFooter.tsx` that displays the specific JSON output of the `MemoryExtractionPipeline` for each turn.
- **Granular Server Logging:** Injected `sql` logging calls into `MemoryExtractionPipeline` to record every sub-step (LLM call, DB store, profile sync) in the system logs.
- **Enhanced API Inspection:** Updated the `/api/inspect` route to consolidate all pipeline runs (Context and Extraction) for a message, enabling a complete audit trail.
- **Version Sync Fix:** Synchronized `package.json`, `history` route, and `seed-version-history.js` to ensure the UI correctly reflects v0.4.16 across all modals.
