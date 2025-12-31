
# Bug Tracking Log
... (Existing entries) ...

---
### Bug #41: Mobile UI Sandwich Collapse & Overflow

**Error Details:**
1. The `ChatInput` component was partially hidden on mobile because `100dvh` was fighting with `position: fixed` on the body.
2. The `Footer` (Status bar) was pushed out of bounds because the `MessageList` flex growth was unconstrained.
3. Toolbar buttons overlapped horizontally due to excessive text labels and missing flex-shrink rules in small viewports.
4. UI broke horizontally when users attempted to select text in the input.

**Solution:**
1. Removed `position: fixed` from body and used strict `100dvh` flex-col mapping in `ChatWindow`.
2. Refactored `ChatInput` to use icon-only toolbar buttons on mobile (`sm:` hidden).
3. Applied `min-width: 0` globally and added `mask-edge-fade` to horizontal scrollbars for better UX.
4. Reduced padding and font-size of secondary tools in mobile view to maximize vertical chat area.

**Modified Files:**
- `app/globals.css`
- `components/chat/ChatWindow.tsx`
- `components/ChatInput.tsx`
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
