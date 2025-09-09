
# Task 5-6: Implement Long Message Collapse

**Related Feature:** `V2 [UI] - Long Message Collapse Feature`

---

### 1. Objective
To add functionality to the `Message.tsx` component to automatically summarize and collapse very long messages, with an option to expand.

### 2. Scope of Work
- Modify the `Message.tsx` component.
- Add a character or word count threshold (e.g., 300 words).
- If a message's content exceeds the threshold:
  - Make a call to a new, simple summarization utility function that uses the `LLMProvider`.
  - Display the summary along with a "Show More" button.
  - Initially, the full content will be hidden.
- Clicking "Show More" will expand the component to reveal the full, original message content.
- The collapsed/expanded state should be managed locally within the `Message.tsx` component.

### 3. Files to be Modified/Created
- `components/Message.tsx` (modified)
- `core/llm/utils/summarize.ts` (created or modified)

### 4. Acceptance Criteria
- [ ] Messages shorter than the threshold are displayed normally.
- [ ] Messages longer than the threshold are initially displayed as a summary.
- [ ] A "Show More" button is visible on collapsed messages.
- [ ] Clicking the button reveals the full message content.
