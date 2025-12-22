
... (Existing entries) ...

---

### Update #33: System Integrity & Cognitive Core (v0.5.1)

**Details:**
Resolved critical type errors hindering the build and fully implemented the cognitive synthesis and agent reasoning backends.

**Changes Made:**
- **FIX (Build):** Unified `CognitivePhase` across `@/lib/types` and `CognitiveStatusBar.tsx`. Now supports `reasoning` and `acting` phases visually.
- **Cognitive Synthesis:** Implemented `/api/ai/synthesis`. It scans `MemoryExtraction` history and `entity_definitions` to generate a live "Knowledge Nexus Report".
- **Agent Loop Integration:** Updated `ChatFooter` and `ConversationProvider` to communicate feature states (`isAgentEnabled`, `isLinkPredictionEnabled`) to the backend.
- **Usage Metrics:** AI Call tracing is now persistent during the session, tracking origins like `synthesis` and `link_prediction`.
- **Backend Chat Update:** The `/api/chat` route now handles conditional logic for ReAct reasoning and proactive link prediction.
