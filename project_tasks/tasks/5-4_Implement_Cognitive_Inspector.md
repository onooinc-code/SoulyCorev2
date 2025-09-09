
# Task 5-4: Implement Cognitive Inspector

**Related Feature:** `V2 [UI] - Cognitive Inspector`

---

### 1. Objective
To add an "Inspect" button to each message's toolbar that opens a modal displaying the pre-LLM context and post-LLM extraction data for that specific turn.

### 2. Scope of Work
- Add a new "Inspect" icon button to the `MessageToolbar.tsx` component.
- Create a new modal component, `CognitiveInspectorModal.tsx`.
- When the "Inspect" button is clicked, the application needs to fetch the relevant data. This will likely involve:
  - Querying the `WorkingMemoryModule` for the saved context of that turn (if it hasn't expired).
  - Querying the `logs` table for the extraction results from the `MemoryExtractionPipeline` for that turn.
- The modal will display the retrieved data in a clear, two-panel layout.

### 3. Files to be Modified/Created
- `components/MessageToolbar.tsx` (modified)
- `components/CognitiveInspectorModal.tsx` (created)

### 4. Acceptance Criteria
- [ ] An "Inspect" button appears on message toolbars.
- [ ] Clicking the button opens the `CognitiveInspectorModal`.
- [ ] The modal correctly displays the context that was sent to the LLM for that message.
- [ ] The modal correctly displays the entities/knowledge that were extracted after the AI's response.
