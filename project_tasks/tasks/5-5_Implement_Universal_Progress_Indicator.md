
# Task 5-5: Implement Universal Progress Indicator

**Related Feature:** `V2 [UI] - Universal Progress Indicator`

---

### 1. Objective
To integrate a system-wide, non-intrusive progress indicator to give users visual feedback on background memory operations.

### 2. Scope of Work
- Choose and install a suitable library for a top-loading bar (e.g., `nprogress`) or create a simple custom component.
- Modify the `AppProvider` to globally track the state of background tasks.
- Create a new global state variable, e.g., `backgroundTaskCount`.
- When a background task (like the memory pipeline) is initiated, increment the counter.
- When the task completes, decrement the counter.
- The progress indicator component will be displayed whenever `backgroundTaskCount` is greater than 0.

### 3. Files to be Modified/Created
- `components/providers/AppProvider.tsx` (modified)
- `components/UniversalProgressIndicator.tsx` (created)
- `app/layout.tsx` (modified to include the indicator component)

### 4. Acceptance Criteria
- [ ] A progress bar appears at the top of the screen when a memory pipeline operation is in progress.
- [ ] The progress bar disappears once the operation is complete.
- [ ] The indicator is subtle and does not block user interaction with the rest of the application.
