

... (Existing entries) ...

---

### Update #39: Global Auth Standardization (v0.5.7)

**Details:**
Completed the authentication fix by ensuring *every* file that instantiates the Google GenAI client checks for both `API_KEY` and `GEMINI_API_KEY`. This eliminates scattered failures where some features worked (like chat generation) but others failed (like memory extraction or agent planning) due to variable naming mismatches.

**Changes Made:**
- **Global:** Updated `lib/gemini-server.ts`, `core/pipelines/memory_extraction.ts`, `core/agents/autonomous_agent.ts`, and `app/api/ai/synthesis/route.ts` to include the API Key fallback logic.
- **Logging:** Added secure, masked logging to the main provider to verify key detection in production logs.
- **Versioning:** Bumped version to `0.5.7`.

**Modified Files:**
- `lib/gemini-server.ts`
- `core/pipelines/memory_extraction.ts`
- `core/agents/autonomous_agent.ts`
- `app/api/ai/synthesis/route.ts`
- `core/llm/providers/gemini.ts`
- `app/api/version/current/route.ts`
- `scripts/seed-version-history.js`
