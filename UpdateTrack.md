
... (Existing entries) ...

---

### Update #44: Toolbar Restoration & Mobile Scroll Fix (v0.5.28)

**Details:**
Following user feedback, the macro and formatting toolbars have been restored to permanent visibility. To prevent the previously reported "half-hidden" input issue, the toolbars utilize a non-wrapping horizontal scroll mechanism.

**Changes Made:**
- **Permanent Toolbars:** Removed the toggle button and expansion state; toolbars are now always visible above and below the text area.
- **Horizontal Swipe Logic:** Integrated `overflow-x-auto` with `mask-edge-fade` to allow smooth horizontal navigation through buttons on small screens without increasing vertical height.
- **Compact UI:** Reduced button and icon sizes slightly to maximize conversation real estate.
- **Arabic Labels:** Updated toolbar labels to Arabic for better user alignment.
- **Versioning:** Bumped version to `0.5.28`.

**Modified Files:**
- `components/ChatInput.tsx`
- `scripts/seed-version-history.js`
- `app/api/admin/seed/route.ts`
