

... (Existing entries) ...

---

### Update #41: Strict Auth Sanitization (v0.5.9)

**Details:**
Following a persistent `400 INVALID_ARGUMENT` error from Google (API key not valid), this update implements aggressive sanitization for environment variables. It specifically targets the removal of surrounding quotes (`"` or `'`), which can sometimes be accidentally pasted into Vercel's environment variable fields.

**Changes Made:**
- **Global:** Updated `core/llm/providers/gemini.ts`, `lib/gemini-server.ts`, and `app/api/models/route.ts` to strip quotes and trim whitespace from the API key.
- **Validation:** Added a server-side warning log if the API key does not start with `AIza`.
- **Diagnostics:** Updated the `api/dev/diagnostics` endpoint to return the key prefix (first 4 chars) and length, allowing the user to verify if the key is being read correctly in the UI.
- **Versioning:** Bumped version to `0.5.9`.

**Modified Files:**
- `core/llm/providers/gemini.ts`
- `lib/gemini-server.ts`
- `app/api/models/route.ts`
- `app/api/dev/diagnostics/route.ts`
- `app/api/version/current/route.ts`
- `scripts/seed-version-history.js`
