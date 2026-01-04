
... (Existing entries) ...

---

### Update #49: Stability Patch (v0.5.45)

**Details:**
Addressed critical crashes in the Projects Hub and 500 errors in the Tools API. These issues prevented users from viewing project tasks and utilizing tool-based agent features.

**Changes Made:**
- **Projects Hub:** Added defensive coding patterns (`Array.isArray`) in the rendering logic to prevent the app from crashing when API responses are malformed or empty during error states.
- **Tools API:** Corrected SQL query syntax to respect case-sensitivity for the `"schemaJson"` column in Postgres, resolving persistent 500 Internal Server Errors.
- **Versioning:** Bumped system version to v0.5.45.

**Modified Files:**
- `components/ProjectsHub.tsx`
- `app/api/tools/route.ts`
- `app/api/tools/[toolId]/route.ts`
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
- `package.json`
