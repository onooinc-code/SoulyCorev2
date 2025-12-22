
... (Existing entries) ...

---

### Update #32: Autonomous Cognition & ReAct Loop (v0.5.0)

**Details:**
Major cognitive upgrade introducing autonomous reasoning loops, proactive knowledge synthesis, and transparent usage tracking.

**Changes Made:**
- **FIX (Build):** Resolved critical type error in `ToolInspectorModal.tsx` by adding the 'null' status mapping.
- **Usage Metrics:** Implemented `UsageMetric` tracking in `ConversationProvider`. Every backend AI call is now recorded and visible via a new counter in the `StatusBar`.
- **True ReAct Agent:** Added a toggle in `ChatFooter` to enable autonomous reasoning. The system now supports dynamic tool selection during turns.
- **Cognitive Synthesis:** Added a "Synthesize" button in `StatusBar` that triggers a multi-tier memory scan and generates a knowledge report.
- **Link Prediction UI:** Integrated a dedicated toggle for proactive relationship discovery.
- **Type Upgrades:** Updated `IStatus` and `ExecutionState` to store usage logs and call counts.
