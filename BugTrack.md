
# Bug Tracking Log

This file documents all bugs encountered and the solutions implemented to resolve them. It serves as an institutional memory to prevent recurring errors and accelerate future debugging.

---

### Bug #1: Lack of a Formal Bug Tracking System
... (Previous entries remain unchanged) ...

### Bug #36: 404 Error on Last AI Report (Response Template)

**Error Details:**
Clicking "Last AI Report" resulted in a 404 error ("No Response Report Found"). The issue was caused by the API route logic (`app/api/responses/latest/route.ts`) which:
1.  Used an overly strict regex (`/^ResponseTemplate-\d+\.html$/`) that only matched files with numeric suffixes, failing to find files like `ResponseTemplate-Storage-Analysis.html`.
2.  Searched in the project root instead of the specific `reports/` directory where the files are stored.
3.  Relied on parsing numbers from filenames for sorting, which breaks for text-based suffixes.

**Solution:**
Refactored `app/api/responses/latest/route.ts` to:
1.  Explicitly target the `reports/` directory using `path.join(process.cwd(), 'reports')`.
2.  Relax the regex to accept any file starting with `ResponseTemplate-` and ending in `.html`.
3.  Implement robust sorting based on file modification time (`mtime`) using `fs.stat`, ensuring the true latest file is always returned regardless of its naming convention.

**Modified Files:**
- `BugTrack.md`
- `app/api/responses/latest/route.ts`

---
### Bug #37: Pipeline Report Generation

**Error Details:**
User requested a detailed technical report on the current state of the pipelines and active chat features after applying optimizations.

**Solution:**
1.  **Optimized `context_assembly.ts`:** Tweaked the salience scoring logic to incorporate a stronger recency bias and frequency weighting.
2.  **Generated Report:** Created `reports/ResponseTemplate-Pipeline-Architecture.html` with Mermaid JS diagrams and detailed feature lists.
3.  **Logging:** Updated `BugTrack.md` (this entry) to record the action.

**Modified Files:**
- `core/pipelines/context_assembly.ts`
- `reports/ResponseTemplate-Pipeline-Architecture.html`
- `BugTrack.md`
