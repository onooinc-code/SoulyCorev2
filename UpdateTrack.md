
... (Existing entries) ...

---

### Update #43: Mobile UI Resilience Overhaul (v0.5.27)

**Details:**
Comprehensive redesign of the chat interface for mobile devices. The goal was to ensure stability, prevent layout breakage during text interaction, and guarantee that the input area remains visible regardless of browser chrome or keyboard state.

**Changes Made:**
- **Compact Toolbars:** Switched to an icon-only interface for the formatting and macro toolbars on mobile.
- **Strict Layout Sandwiches:** Enforced a `flex-shrink-0` footer and input area with a `min-h-0` growable message list.
- **Visual Refinement:** Added animated edge-fading for scrollable toolbars.
- **Input Optimization:** Reduced max-height of text area on mobile to 120px to prevent viewport takeover.
- **Versioning:** Bumped version to `0.5.27`.

**Modified Files:**
- `app/globals.css`
- `components/chat/ChatWindow.tsx`
- `components/ChatInput.tsx`
- `BugTrack.md`
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
