

... (Existing entries) ...

---

### Update #37: Deployment & Critical Error Fixes (v0.5.5)

**Details:**
Previous updates failed to deploy due to a database connection attempt during the build process (`postinstall` script). This update removes that script to ensure clean deployment. Additionally, hardened the UI against API failures to prevent the "Querying..." freeze and added specific checks for API Key presence.

**Changes Made:**
- **Vercel Config:** Removed `postinstall` script from `package.json` to decouple DB operations from the build process.
- **ConversationProvider:** Added `try/finally` logic to force monitor reset on API failure.
- **GeminiProvider:** Added explicit check for `process.env.API_KEY` existence.
- **Versioning:** Bumped version to `0.5.5`.

**Modified Files:**
- `package.json`
- `components/providers/ConversationProvider.tsx`
- `core/llm/providers/gemini.ts`
- `app/api/version/current/route.ts`
- `scripts/seed-version-history.js`
