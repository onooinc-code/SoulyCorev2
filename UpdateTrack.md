

... (Existing entries) ...

---

### Update #42: Robust Auth Strategy (v0.5.10)

**Details:**
Implemented a smart key selection strategy to resolve persistent authentication errors. The system now iterates through available environment variables (`API_KEY`, `GEMINI_API_KEY`) and prioritizes the one that matches the Google API Key format (starts with `AIza`). This fixes issues where one variable might be present but invalid (e.g., placeholder text) and was blocking the fallback to the valid key.

**Changes Made:**
- **Smart Resolution:** Updated `lib/gemini-server.ts`, `core/llm/providers/gemini.ts`, and `app/api/models/route.ts` to iterate candidates and select the first valid-looking key.
- **Sanitization:** Hardened quote stripping and whitespace trimming logic.
- **Diagnostics:** Updated the diagnostics endpoint to transparently report which key source is being used.
- **Versioning:** Bumped version to `0.5.10`.

**Modified Files:**
- `lib/gemini-server.ts`
- `core/llm/providers/gemini.ts`
- `app/api/models/route.ts`
- `app/api/dev/diagnostics/route.ts`
- `app/api/version/current/route.ts`
- `scripts/seed-version-history.js`
