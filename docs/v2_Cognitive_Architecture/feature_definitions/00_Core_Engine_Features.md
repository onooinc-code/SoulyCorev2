
# Feature Registry: Core Engine

**Status:** All features listed in this document have been **implemented** as part of the Cognitive Architecture v2.0 release.

This document lists the foundational, backend business logic features of the Cognitive Architecture.

| Feature                                      | Description                                                                                                                              | Key UI/UX Considerations                                  |
| :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Core Services Layer Scaffolding**          | Established the new `core/` directory and its subdirectories to house all new, decoupled business logic.                                   | None (Backend architecture).                              |
| **"Brain" Configuration Management**         | Foundational system to define and manage Agent "Brains" and map them to specific memory module namespaces for data isolation.            | Managed via the "Brain Management Tab" UI.                |
| **Single Memory Module (SMM) Interfaces**    | Defined standardized TypeScript interfaces for each memory type (Episodic, Semantic, etc.) to ensure a consistent internal API.              | None (Backend architecture).                              |
| **LLM Provider Abstraction Layer**           | Implemented an adapter pattern to decouple the system from any specific AI provider SDK, ensuring future flexibility.                        | None (Backend architecture).                              |
| **Episodic Memory Module v2**                | Refactored logic to manage conversation history in Vercel Postgres, implementing the new SMM interface.                                    | Data is viewable in the "Memory Module Viewer" UI.        |
| **Semantic Memory Module v2**                | Refactored logic for all interactions with Pinecone (embedding, search), implementing the SMM interface.                                   | Data is viewable in the "Memory Module Viewer" UI.        |
| **Structured Memory Module v2**              | Refactored logic for managing structured data (entities, contacts) in Vercel Postgres, implementing the SMM interface.                     | Data is viewable in the "Memory Module Viewer" UI.        |
| **Working Memory Module (Vercel KV)**        | New module using Vercel KV for high-speed, temporary storage of in-flight data, like assembled prompt context.                             | None (Ephemeral backend process).                         |
| **Context Assembly Pipeline**                | The "Read Path" that intelligently queries SMMs to build a compact, optimized context for the LLM on each turn.                          | The process is visualized in the "Cognitive Inspector".     |
| **Memory Extraction Pipeline**               | The "Write Path" that runs post-conversation to analyze the exchange, extract knowledge, and commit it to long-term memory.               | The process is visualized in the "Cognitive Inspector".     |
