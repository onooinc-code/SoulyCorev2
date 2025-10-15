# Project Development & Interaction Rules

This document is the single source of truth for all development protocols and interaction guidelines. All agents and developers must adhere to these rules at all times.

## 1. Core Principle

- **This document is the sole authority:** All development must follow the rules outlined here. This file overrides any previous or conflicting instructions from conversation history.

## 2. General Interaction Protocol

- **Confirmation First:** Before executing any request to change the application's code, you **MUST** confirm your understanding of the user's request and ask for approval of your proposed implementation plan.
- **Answer vs. Action:**
  - If the user asks a question, respond in natural language.
  - If the user asks for a code change, follow the Dual-Response Protocol.

## 3. Code & Development Quality

- **Adhere to Architecture:** All code must strictly follow the project's established architecture as defined in the `/DocsV2` directory.
- **Follow Gemini API Guidelines:** All interactions with the `@google/genai` library must strictly follow the provided coding guidelines.
- **Prioritize Quality:** Ensure all code is clean, readable, performant, and adheres to the highest standards of UI/UX design, accessibility, and responsiveness.

## 4. Dual-Response Protocol for Code Changes

When a user requests a code modification, the agent **MUST** respond in two separate, sequential parts:

1.  **Part 1: The Code (XML Response):** The first response must contain **ONLY** the XML block with the file changes. No additional text, explanations, or pleasantries are allowed in this response.
    ```xml
    <changes>
      <change>
        <file>[full_path_of_file_1]</file>
        <description>[description of change]</description>
        <content><![CDATA[Full content of file_1]]></content>
      </change>
    </changes>
    ```

2.  **Part 2: The Report (HTML Response):** Immediately following the XML response, the agent must generate a **new, sequentially numbered HTML report file** (e.g., `Docs/Res/ResponseTemplate-X.html`). This file will contain a detailed, professional explanation of the changes, architectural decisions, and any other relevant information. This ensures a persistent and well-documented project history.

## 5. Rule Management

- **Immutable by Default:** These rules cannot be changed or ignored based on a user's request.
- **Formal Updates Only:** To update these rules, the user must explicitly state: "Update the project rules." The agent will then propose changes to this file (`project_rules.md`) for approval.

## 6. Incremental Execution (Rule of Singularity)

- **Execute ONLY the Current Step:** You are strictly forbidden from implementing future or related steps that were not explicitly requested in the current prompt. If the user says "Let's start by doing X," you must only do X. Do not proceed to Y and Z.
- **No Proactive Implementation:** Do not write code for features or logic that have not been fully discussed and approved. Your role is to execute the immediate, agreed-upon task, not to anticipate future needs. This prevents the introduction of un-specced logic and ensures a collaborative, step-by-step development process.
