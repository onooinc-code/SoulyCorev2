
... (Existing entries) ...

---

### Update #34: UX Integrity & Version Sync (v0.5.2)

**Details:**
Addressed user feedback regarding missing UI controls and outdated versioning. Moved Agent Setup to a global context for better accessibility and synchronized version history.

**Changes Made:**
- **UI Architecture:** Lifted `AgentConfigModal` state to `UIStateProvider`, making it accessible globally.
- **Sidebar:** Added `Agent Setup` button to `SidebarToolbar` for persistent access.
- **Versioning:** Updated seed scripts and API route to reflect version **0.5.2**.
- **Refactor:** Cleaned up `ChatWindow` and `ChatModals` to use global state for agent configuration.

**Modified Files:**
- `components/providers/UIStateProvider.tsx`
- `components/modals/GlobalModals.tsx`
- `components/SidebarToolbar.tsx`
- `components/ChatWindow.tsx`
- `components/chat/ChatModals.tsx`
- `scripts/seed-version-history.js`
- `app/api/version/current/route.ts`
