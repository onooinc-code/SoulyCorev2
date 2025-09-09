
# SoulyCore v2: The Cognitive Model

**Document Version:** 2.0
**Status:** Live

---

### 1. Introduction

This document defines the conceptual model for the AI's memory, which draws inspiration from human cognitive psychology. This model has been implemented to create a robust, relatable, and powerful memory system by separating concerns into distinct modules, which together form an Agent's "Brain."

### 2. The "Brain" Concept

A **Brain** is the central cognitive container for a single AI Agent. It is a configuration, stored in the `brains` database table, that maps to a collection of Single Memory Modules. Each module can operate within a specific `namespace`, allowing for data isolation and enabling the architecture to power multiple agents with unique knowledge sets. For example, a "Work Brain" and a "Personal Brain" can share some memory modules while keeping others entirely separate.

### 3. Single Memory Modules (SMMs)

These are the foundational building blocks of a Brain. Each module is a specialized, single-responsibility class for one type of information processing and storage.

| Memory Module | Purpose & Analogy | Type of Data Stored | Key Function |
| :--- | :--- | :--- | :--- |
| **Episodic Memory** | *"What happened?"* | Conversation history, user interactions, events. A chronological log of experiences. | Stores and retrieves the raw, linear sequence of messages and events from Vercel Postgres. |
| **Semantic Memory** | *"What do I know?"* | Distilled facts, concepts, and knowledge extracted from episodic memory. The AI's internal knowledge base. | Stores and retrieves factual information and conceptual relationships via vector similarity search in Pinecone. |
| **Structured Memory**| *"Who/what do I know?"*| User-defined, schema-enforced data like contacts, companies, or projects. A personal CRM. | Stores and retrieves structured data entities with explicit attributes and relationships from Vercel Postgres. |
| **Working Memory** | *"What am I thinking about right now?"* | Ephemeral, short-term data for the current conversational turn. Includes assembled context and intermediate thoughts. | Holds the pre-processed context in Vercel KV (Redis) before sending to the LLM. |
| **Procedural Memory**| *"What can I do?"* | A registry of available tools and multi-step workflows the AI can execute. | (Future Scope) Provides the AI with capabilities beyond simple text generation. |


### 4. Workflow Memory Pipelines

While SMMs store information, **Workflow Memory Pipelines** are the active processes that use and manipulate that information. They orchestrate calls across multiple SMMs to perform high-level cognitive tasks.

#### 4.1. Context Assembly Pipeline (The "Read Path")
This pipeline is executed *before* sending a prompt to the LLM. Its goal is to build the most relevant and compact context possible.
1.  **Retrieve Recent History:** Fetches the last N messages from **Episodic Memory**.
2.  **Query Knowledge:** Performs a vector search against **Semantic Memory** based on the user's query to find relevant facts.
3.  **Fetch Entities:** Retrieves relevant profiles from **Structured Memory** based on the conversation and user query.
4.  **Assemble & Prune:** Combines these sources into a `context` block.

#### 4.2. Memory Extraction Pipeline (The "Write Path")
This pipeline is executed asynchronously *after* a conversational turn is complete. Its goal is to learn from the interaction.
1.  **Ingest Turn:** Takes the user prompt and the final AI response from the completed turn.
2.  **Extract & Distill:** An LLM-powered process analyzes the text to:
    *   Identify new facts or update existing ones for **Semantic Memory**.
    *   Recognize new entities (people, projects) to be added to **Structured Memory**.
3.  **Commit to Memory:** The extracted information is written to the appropriate SMMs, enriching the Brain for future conversations.
