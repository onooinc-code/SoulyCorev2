
# Bug Tracking Log
... (Previous entries) ...

---
### Bug #39: Vercel Build Failure & Data Persistence Issue

**Error Details:**
1. Build failed on Vercel due to `response.text` being possibly undefined in `experience_consolidation.ts`.
2. All database data was being wiped on every new deployment due to `DROP TABLE IF EXISTS` in the initialization script.

**Solution:**
1. Added proper null checks for all AI response objects in pipelines.
2. Removed `DROP TABLE` statements from `create-tables.js` and replaced with safe `CREATE TABLE IF NOT EXISTS` commands.
3. Added a dedicated "Logs" button in the `StatusBar` to ensure the Debug Log panel is easily accessible.

**Modified Files:**
- `core/pipelines/experience_consolidation.ts`
- `scripts/create-tables.js`
- `components/StatusBar.tsx`
- `app/api/version/current/route.ts`
- `app/api/version/history/route.ts`
- `scripts/seed-version-history.js`
