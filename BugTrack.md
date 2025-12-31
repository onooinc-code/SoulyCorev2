
... (Existing entries) ...

---
### Bug #42: Vertical Scrollbar Disappearance in MessageList

**Error Details:**
After introducing horizontal scrolling for toolbars and `no-scrollbar` classes, the vertical scrollbar for the primary chat history (MessageList) was suppressed due to parent container `overflow: hidden` and missing explicit `overflow-y-auto` on the list component.

**Solution:**
1. Explicitly added `overflow-y-auto` to the `MessageList` component.
2. Verified `custom-scrollbar` CSS definitions in `globals.css` were not using `scrollbar-width: none`.
3. Ensured `ChatWindow` uses `flex-1 min-h-0` to allow the internal list to compute its height correctly for scrolling.

**Modified Files:**
- `app/globals.css`
- `components/chat/MessageList.tsx`
- `app/api/admin/seed/route.ts`
