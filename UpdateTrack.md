

... (Existing entries) ...

---

### Update #40: Key Sanitization & Diagnostics (v0.5.8)

**Details:**
Addressed the persistent "Invalid API Key" error by implementing rigorous whitespace sanitization for environment variables. Additionally, added a live "AI Connectivity" test to the Dev Center's Cognitive Diagnostics panel, allowing for instant verification of the API key's validity against Google's servers.

**Changes Made:**
- **GeminiProvider & Gemini Server:** Added `.trim()` to all API key retrievals to prevent hidden whitespace characters from breaking authentication.
- **Cognitive Diagnostics:** Added a real-time `ai_connectivity` check that pings the `gemini-2.5-flash` model to verify the key and quota.
- **UI:** Updated the diagnostics panel to show the source of the key (`API_KEY` vs `GEMINI_API_KEY`) and its status.
- **Versioning:** Bumped version to `0.5.8`.

**Modified Files:**
- `core/llm/providers/gemini.ts`
- `lib/gemini-server.ts`
- `app/api/dev/diagnostics/route.ts`
- `components/dev_center/CognitiveDiagnostics.tsx`
- `app/api/version/current/route.ts`
- `scripts/seed-version-history.js`
