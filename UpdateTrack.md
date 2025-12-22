
... (Existing entries) ...

---

### Update #29: Multimodal Memory Monitoring & Navigation Fix (v0.4.17)

**Details:**
Introduced a granular monitoring system for all memory tiers (Semantic, Structured, Graph, Episodic) and fixed navigation issues in the Context Menu.

**Changes Made:**
- **Memory Monitor State:** Added `MemoryMonitorState` to `ConversationProvider` to track the execution status of each memory tier independently.
- **Status Bar Integration:** Added four new interactive buttons to `StatusBar.tsx` representing each memory dimension.
- **Visual Feedback:** Implemented a three-color state system (Yellow/Green/Red) with pulse animations for all monitors.
- **Navigation Fix:** Refactored `setCurrentConversation` to ensure immediate view switching when triggered from secondary UI elements like context menus.
- **Auto-Reset Mechanism:** Integrated `resetMonitors` into the `addMessage` flow to ensure a clean state for every interaction.
