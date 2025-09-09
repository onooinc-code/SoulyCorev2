
# SoulyCore: Project Overview

**Document Version:** 2.0
**Status:** Current Implementation (Cognitive Architecture v2.0)

---

### 1. High-Level Summary

SoulyCore is a full-stack, AI-powered assistant built with Next.js 14, designed as a **Total Recall Companion**. Its core differentiator is a persistent, multi-layered memory system powered by a decoupled **Cognitive Engine**. This engine provides deep contextual understanding and continuity across conversations by managing specialized memory modules for different types of information.

The architecture is server-centric and highly modular. All AI interactions and database operations are handled through a dedicated **Core Services Layer**, which is called by lightweight Next.js API routes. This ensures a clean separation of concerns, enhances security, and improves maintainability. The system is designed to learn from user interactions by automatically processing conversations through an asynchronous pipeline to extract and store valuable information in its structured (Vercel Postgres) and semantic (Pinecone) memory stores.

### 2. Core Technologies

The application is built on a modern, cloud-native, and highly scalable stack:

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI/Animation:** React, Framer Motion
*   **AI Model:** Google Gemini API (`@google/genai`) via an abstracted **LLM Provider**.
*   **Episodic Memory (Conversations):** Vercel Postgres
*   **Structured Memory (Entities, Contacts, etc.):** Vercel Postgres
*   **Semantic Memory (Knowledge):** Pinecone
*   **Working Memory (Ephemeral Cache):** Vercel KV (Redis)
*   **Deployment Platform:** Vercel

### 3. Target User

SoulyCore is targeted at **power users, developers, and small teams**. The ideal user requires an AI assistant that goes beyond simple question-and-answer sessions and acts as a long-term knowledge partner.

Key features supporting this user profile include:
*   **Persistent Multi-Modal Memory:** The core value proposition, enabling long-term context retention for complex projects.
*   **The Brain Center:** A dedicated UI for managing the AI's cognitive functions, including its "Brains" and memory modules.
*   **Cognitive Inspector:** A tool that allows users to "look inside the AI's head" to see the context it used for a response and what it learned from the interaction.
*   **SoulyDev Center:** A comprehensive suite of integrated tools, including a live Feature Dictionary and a Feature Health Dashboard for QA.
*   **Prompts Hub with Workflows:** Enables sophisticated users to create and execute powerful, multi-step, dynamic prompt chains.
