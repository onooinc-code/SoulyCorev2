
# SoulyCore Official Documentation

**Document Version:** 3.0
**Status:** Live (Reflects Cognitive Architecture v2.0)

---

## Part 1: Business & Vision

### 1.1 Executive Summary

**SoulyCore** is a next-generation, AI-powered assistant built on the foundational principle of a persistent, intelligent, and multi-faceted memory. Evolved into its second-generation Cognitive Architecture, it now functions as a true **Total Recall Companion**. It actively learns from every interaction by leveraging a decoupled, modular Core Engine to manage its long-term memory and cognitive functions.

It is built for power users, developers, and small teams who require an AI partner that not only answers questions but also retains context, manages complex information, and proactively assists in sophisticated workflows through a secure, cloud-native, and highly configurable platform.

### 1.2 Vision: The Total Recall Companion

The core vision of SoulyCore is to create a true AI partner that grows alongside its user. The v2 Cognitive Architecture directly addresses the "digital amnesia" of traditional AI assistants by externalizing memory into specialized, independently managed modules. This allows SoulyCore to maintain long-term context, synthesize new insights from disparate information, and become an indispensable hub for both personal and professional knowledge management.

---

## Part 2: Technical Documentation

The detailed technical documentation for SoulyCore is organized into several key documents within the `/docs` directory.

*   **[Project Overview](./docs/00_Project_Overview.md):** A high-level summary of the application's purpose, core technologies, and target user.
*   **[Frontend Architecture](./docs/01_Frontend_Architecture.md):** A breakdown of the React component structure, state management strategy with React Context, and key UI interaction flows.
*   **[Backend API Architecture](./docs/02_Backend_API_Architecture.md):** A complete inventory of all Next.js API endpoints and a deep dive into the logic of the core `chat` and `memory` pipeline routes.
*   **[Data Model](./docs/03_Data_Model.md):** A detailed schema reference for all tables in the Vercel Postgres database, including `conversations`, `messages`, `brains`, and `feature_tests`.
*   **[Developer Tooling](./docs/04_Developer_Tooling.md):** An overview of the integrated tools for developers, including the SoulyDev Center, live Features Dictionary, and the new Feature Health Dashboard.

### Cognitive Architecture v2.0 Deep Dive

For an in-depth understanding of the new backend engine, please refer to the specific documents in the `docs/v2_Cognitive_Architecture` directory. These have been updated to reflect the implemented system.
