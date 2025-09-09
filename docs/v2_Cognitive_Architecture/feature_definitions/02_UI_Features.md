
# Feature Registry: User Interface

**Status:** All features listed in this document have been **implemented** as part of the Cognitive Architecture v2.0 release. The "Manual Context Injection" feature remains a future scope item.

This document lists the new user interface components and features required to manage and interact with the v2 Cognitive Architecture.

| Feature                                | Description                                                                                                                             | Key UI/UX Considerations                                                              |
| :------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **The "Brain Center" Hub**             | A new, top-level modal serving as the central management hub for all cognitive components.                                              | Provides an intuitive overview of the AI's cognitive state.           |
| **Brain Management Tab**               | A UI panel within the Brain Center for creating, viewing, and configuring Agent Brains and their memory namespaces.                       | Simple forms and clear diagrams show Brain-to-Module connections.                |
| **Memory Module Viewer Tab**           | A UI panel providing a direct view into each memory module, allowing for inspection of stored data.                                     | Read-only views with options for manual data management. |
| **Cognitive Inspector**                | An "Inspect" button on every chat message that shows the exact context sent to the LLM and the data extracted from that turn.             | A clear, side-by-side view of "Pre-LLM Context" and "Post-LLM Extraction".            |
| **Universal Progress Indicator**       | A non-intrusive, system-wide progress indicator (a top-loading bar) that visualizes all background memory operations.                     | Subtle but noticeable, providing reassurance that the system is working.      |
| **Long Message Collapse Feature**      | An automatic, content-aware summarization and collapse feature for long messages in the chat view.                                      | Users can always expand to see the original, full content.                |
| **Manual Context Injection** (Future Scope) | Tooling to allow a user to manually select and inject a piece of memory into the current conversation turn. | Could be a new button in the `ChatInput` or an action in the `Memory Module Viewer`. |
