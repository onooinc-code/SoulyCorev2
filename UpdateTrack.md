
... (Existing entries) ...

---

### Update #48: Project Knowledge Injection (v0.5.44)

**Details:**
Implemented a specialized workflow for injecting technical context (Business Logic, Schema, Code) directly into specific Projects. This allows the AI to reference large, project-specific knowledge bases without polluting the conversational context window.

**Changes Made:**
- **Projects Hub:** Added a "Technical Context" button to each project card.
- **Context Modal:** Created `ProjectContextModal.tsx` to handle large text input and categorization (Business, Schema, Code).
- **Backend API:** Implemented `app/api/projects/[projectId]/context/route.ts` to process and store this context in both Semantic Memory (Pinecone) for RAG and Document Memory (MongoDB) for archives.
- **Versioning:** Updated system version to v0.5.44.

**Modified Files:**
- `components/ProjectsHub.tsx`
- `components/modals/ProjectContextModal.tsx` (New)
- `app/api/projects/[projectId]/context/route.ts` (New)
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
- `package.json`
