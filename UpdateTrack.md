... (Existing entries) ...

---

### Update #27: Scrolling & Layout Integrity (v0.4.14)

**Details:**
Resolved a critical UI issue where the message list would expand beyond the viewport instead of scrolling, and the scrollbar was effectively invisible or non-functional.

**Changes Made:**
- **Flexbox min-h-0 Fix:** Applied `min-h-0` to the message container in `ChatWindow.tsx` to enable proper inner scrolling in nested flex layouts.
- **Scrollbar Visibility:** Enhanced the global scrollbar styles in `globals.css` and added a `custom-scrollbar` utility class with `scrollbar-gutter: stable` to prevent layout shift.
- **Positioning Fix:** Changed `MessageList.tsx` container to use `absolute inset-0` to guarantee it stays within its parent's bounds.
- **Bottom Padding:** Added `pb-20` to the message list content to ensure the last message isn't obscured by the fixed input area.