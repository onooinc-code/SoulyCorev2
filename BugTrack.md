# Bug Tracking Log

This file documents all bugs encountered and the solutions implemented to resolve them. It serves as an institutional memory to prevent recurring errors and accelerate future debugging.

---

### Bug #1: Lack of a Formal Bug Tracking System

**Error Details:**
The development process lacked a formal, persistent bug tracking system. This led to recurring errors and frustration for the user, as there was no historical record of past fixes to learn from or refer to.

**Solution:**
Implemented a new protocol requiring the creation and maintenance of this `BugTrack.md` file. As per the user's request, all future bug fixes will be logged here. The process involves:
1. Reviewing this file before starting a new fix.
2. Adding a horizontal rule (`---`) below the last entry.
3. Documenting the new error, the solution, and the files that were modified.
4. Confirming this process was followed in the response to the user.

**Modified Files:**
- `BugTrack.md` (This file)

**Changes Made:**
- Created the file and added this initial entry to formally establish the new bug tracking process.

---

### Bug #2: Incomplete Command Palette Feature

**Error Details:**
The `mod+k` keyboard shortcut is registered in `App.tsx` to toggle the `isCommandPaletteOpen` state, and `GlobalModals.tsx` is set up to render the `CommandPalette` component. However, the `components/CommandPalette.tsx` file itself is missing, making the feature non-functional. Additionally, the `lib/actionsRegistry.ts` file is missing several key actions available elsewhere in the UI.

**Solution:**
1.  **Expanded Action Registry:** Added missing actions (e.g., 'Open Command Palette', 'View Shortcuts', 'Add Knowledge') to `lib/actionsRegistry.ts` to provide a comprehensive list of commands.
2.  **Created Command Palette Component:** Created the `components/CommandPalette.tsx` file and implemented its full functionality. This includes:
    *   Fetching actions from the newly expanded registry.
    *   A search input to filter actions in real-time.
    *   Grouping actions by section for better organization.
    *   Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape).
    *   Mapping action `handlerId`s to context functions to execute them upon selection.
    *   Styling the component with the `glass-panel` theme to match the application's aesthetic.

**Modified Files:**
- `BugTrack.md`
- `lib/actionsRegistry.ts`
- `components/CommandPalette.tsx` (new file)

---

### Bug #3: React 'key' Prop Anti-pattern

**Error Details:**
Multiple components throughout the application use a common React anti-pattern in list rendering. Instead of applying the unique `key` prop directly to the component being iterated over in a `.map()` loop, it is applied to a wrapping `<div>` or `<React.Fragment>`. This triggers React warnings in the console (`Warning: Each child in a list should have a unique "key" prop.`) and can lead to incorrect state management and rendering bugs during list updates.

**Solution:**
Refactored the list rendering logic in all affected components to move the `key` prop from the unnecessary wrapper element directly onto the primary component within the `.map()` loop. This adheres to React best practices, eliminates the console warnings, and ensures stable rendering.

**Modified Files:**
- `BugTrack.md`
- `components/chat/MessageList.tsx`
- `components/dev_center/FeaturesDictionary.tsx`
- `components/dev_center/FeatureHealthDashboard.tsx`
- `components/CognitiveInspectorModal.tsx`
- `components/data_hub/ServicesPanel.tsx`
- `components/hubs/ExperiencesHub.tsx`

**Changes Made:**
- **`MessageList.tsx`**: Moved `key` prop to the `ConversationTurnSeparator` component.
- **`FeaturesDictionary.tsx`**: Removed wrapping `div` and moved `key` prop to `FeatureItem`.
- **`FeatureHealthDashboard.tsx`**: Removed wrapping `div` and moved `key` prop to `FeatureRow`.
- **`CognitiveInspectorModal.tsx`**: Removed wrapping `div` and moved `key` prop to `PipelineStep`.
- **`ServicesPanel.tsx`**: Removed wrapping `div` and moved `key` prop to `ServiceCard`.
- **`ExperiencesHub.tsx`**: Removed wrapping `div` and moved `key` prop to `ExperienceCard`.
---

### Bug #4: Critical Missing Modal Components

**Error Details:**
The application was failing to compile because `ChatWindow.tsx` was importing and attempting to render several modal components (`ChatModals.tsx`, `ConversationSettingsModal.tsx`, `ContextViewerModal.tsx`) that did not exist. This broke the entire chat interface.

**Solution Implemented:**
The missing modal components were created and integrated to resolve the compilation error and complete the chat UI functionality.
1.  **Created Core Modals**: Implemented `ConversationSettingsModal.tsx` for model settings and `ContextViewerModal.tsx` for inspecting AI context.
2.  **Added API Endpoint**: Created `app/api/models/route.ts` to supply a list of recommended models to the settings UI.
3.  **Centralized Modal Logic**: Developed a `ChatModals.tsx` wrapper to manage the state and rendering of all chat-related modals, cleaning up `ChatWindow.tsx`.
4.  **Integrated Triggers**: Updated `ChatWindow.tsx` to use the new wrapper and modified `MessageToolbar.tsx` to include buttons that open the context viewer. This completes the feature and resolves the critical build failure.

**Modified Files:**
- `BugTrack.md`
- `app/api/models/route.ts` (new file)
- `components/ConversationSettingsModal.tsx` (new file)
- `components/ContextViewerModal.tsx` (new file)
- `components/chat/ChatModals.tsx` (new file)
- `components/ChatWindow.tsx`
- `components/MessageToolbar.tsx`
