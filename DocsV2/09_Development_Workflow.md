# HedraCore: Development Workflow & Agent Guidelines

**Document Version:** 1.0
**Status:** Live

---

### 1. Introduction

This document outlines the standardized procedures and guidelines that all developers and AI agents must follow when contributing to the HedraCore project. Adherence to these rules ensures consistency, maintainability, and a high-quality, well-documented development process.

---

### 2. Guideline: Onboarding & Context Assembly (Start of Every Session)

Before initiating any task, a development agent **MUST** establish a full understanding of the project's current state.

1.  **Mandatory Reading:** The agent must begin by reading and processing the content of the following key documentation files:
    *   `DocsV2/01_System_Architecture.md`: To understand the high-level data flow and component interaction.
    *   `DocsV2/06_Frontend_Architecture.md`: To understand the UI structure and state management.
    *   `DocsV2/09_Development_Workflow.md`: This document, to understand the required procedures.

2.  **Code Review:** The agent must review the contents of the following critical files to understand current implementation patterns:
    *   `components/providers/AppProvider.tsx`: To understand client-side state management.
    *   `app/api/chat/route.ts`: To understand the primary backend API logic.
    *   `core/pipelines/context_assembly.ts`: To understand the core cognitive logic.

---

### 3. Guideline: Feature Management & Planning

No feature implementation should begin without following this structured planning process.

1.  **Phase 1: Discussion & Proposal:** The user will propose a new feature. The agent's role is to discuss the requirements, clarify ambiguities, and suggest potential technical approaches.

2.  **Phase 2: Formal Registration:** Once the feature is well-defined, the agent (or user) **MUST** add it to the project's official feature registry. This is done by creating a new entry in the `features` database table. The initial entry must include:
    *   A clear `name`.
    *   A detailed `overview`.
    *   A status set to `⚪ Planned`.

3.  **Phase 3: Approval:** The agent must wait for explicit user approval before proceeding with the implementation of a feature marked as `⚪ Planned`.

---

### 4. Guideline: Implementation & Versioning

Once a feature is approved, the following process must be followed for implementation and deployment.

1.  **Code Implementation:** The agent will write the necessary code, adhering to all existing patterns and the architectural documentation.

2.  **Update Feature Status:** Upon completion of the code, the agent **MUST** update the status of the corresponding entry in the `features` table to `✅ Completed`.

3.  **Versioning:** For any significant feature addition or change that results in a new build, the project's version **MUST** be incremented.
    *   Update the `version` field in `package.json` following semantic versioning principles (e.g., `0.2.0` -> `0.3.0`).
    *   Create a new entry in the `version_history` database table. This entry must include the new version number, the release date, and a concise, user-friendly summary of the changes in Markdown format.

4.  **Commit & Deployment:** The Git commit message for the feature must be clear and reference the new version number. For example: `feat: Implement versioning system (v0.2.0)`. This ensures a clear link between code changes and releases.
