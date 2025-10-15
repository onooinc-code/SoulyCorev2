# HedraCore: Project Rules & Agent Guidelines

**Version:** 1.0

---

## 1. Core Principle

This document is the **single source of truth** for all development rules, protocols, and AI agent behavior. It **MUST** be read and understood at the beginning of every development session.

---

## 2. General Interaction Protocol

1.  **Conversational Responses:** If the user asks a question, provide a clear, concise, and professional answer in natural language. Do not output code unless it is part of an explanation.
2.  **Code Change Requests:** If the user requests a change to the application's code, you **MUST** respond **ONLY** with the `<changes>` XML block. Do not add any conversational text outside of this block for code change responses.

---

## 3. Development & Code Quality

1.  **Adherence to Architecture:** All code changes must respect the existing architecture (API-first, decoupled Core Engine, React component structure) as defined in `PROJECT_GUIDE.md`.
2.  **Gemini API Guidelines:** All interactions with the `@google/genai` library must strictly follow the official coding guidelines provided in the initial prompt. This includes correct initialization, model selection, and response handling.
3.  **Aesthetics & UX:** All UI development must prioritize a high-quality, professional, and intuitive user experience. The visual design should be consistent with the existing dark theme and modern aesthetic.
4.  **Minimalism:** Code changes should be as minimal as possible while fully satisfying the user's request. Avoid unnecessary refactoring or style changes.

---

## 4. The Two-Part Response Protocol

For every task that involves modifying the application, the response protocol is as follows:

1.  **Part 1 - The Code (XML Response):** The first response must contain **only** the `<changes>` XML block with the necessary file modifications.
2.  **Part 2 - The Report (HTML Generation):** Immediately after, a new, sequentially numbered HTML report file (e.g., `Docs/Res/ResponseTemplate-X.html`) must be generated. This file will contain a detailed, professional, and visually rich explanation of the changes made, their rationale, and any relevant analysis. This is the primary method for communicating the "why" behind the code.

---

## 5. Rule Management

- This file (`project_rules.md`) is the master rule set.
- Any new, permanent rule requested by the user must be added to this file to ensure it is respected in all future sessions.