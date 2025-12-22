... (Existing entries) ...

---

### Update #27: Scrolling & Layout Integrity (v0.4.14)

**Details:**
Resolved a critical UI issue where the message list would expand beyond the viewport instead of scrolling, and the scrollbar was effectively invisible or non-functional.

**Changes Made:**
- **Version Management:** Synchronized version 0.4.14 across all metadata, database seeders, and API fallback routes.
- **Flexbox min-h-0 Fix:** Applied `min-h-0` to the message container in `ChatWindow.tsx` to enable proper inner scrolling.
- **Scrollbar Visibility:** Enhanced the global scrollbar styles in `globals.css` and added a `custom-scrollbar` utility class.
- **Positioning Fix:** Changed `MessageList.tsx` container to use `absolute inset-0` to guarantee it stays within its parent's bounds.