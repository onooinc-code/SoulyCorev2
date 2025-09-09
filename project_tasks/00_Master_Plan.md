# Master Implementation Plan: Cognitive Architecture v2.0

This document provides a high-level overview of all planned tasks for the v2.0 refactor. Each task is detailed in a separate file within the `tasks/` directory.

| Phase | Task ID | Task Description | Related Feature | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1: Foundational Backend** | 1-1 | Create Core Directory Structure | `V2 [Core] - Core Services Layer Scaffolding` | `✅ Completed` |
| | 1-2 | Define Core Types & Interfaces | `V2 [Core] - Single Memory Module (SMM) Interfaces` | `✅ Completed` |
| | 1-3 | Update Database Schema | `V2 [Core] - "Brain" Configuration Management` | `✅ Completed` |
| **2: Core Module Impl.** | 2-1 | Implement LLM Provider Abstraction | `V2 [Core] - LLM Provider Abstraction Layer` | `✅ Completed` |
| | 2-2 | Implement Working Memory Module | `V2 [Core] - Working Memory Module` | `✅ Completed` |
| | 2-3 | Implement Episodic Memory Module | `V2 [Core] - Episodic Memory Module` | `✅ Completed` |
| | 2-4 | Implement Semantic Memory Module | `V2 [Core] - Semantic Memory Module` | `✅ Completed` |
| | 2-5 | Implement Structured Memory Module | `V2 [Core] - Structured Memory Module` | `✅ Completed` |
| **3: Pipeline Orchestration**| 3-1 | Implement Context Assembly Pipeline | `V2 [Core] - Context Assembly Pipeline` | `✅ Completed` |
| | 3-2 | Implement Memory Extraction Pipeline | `V2 [Core] - Memory Extraction Pipeline` | `✅ Completed` |
| **4: API Layer Refactor** | 4-1 | Refactor Chat Endpoint | `V2 [API] - Refactor /api/chat Endpoint` | `✅ Completed` |
| | 4-2 | Refactor Memory Pipeline Endpoint | `V2 [API] - Refactor /api/memory/pipeline Endpoint` | `✅ Completed` |
| | 4-3 | Create Brain Management API | `V2 [API] - Brain Management Endpoints` | `✅ Completed` |
| | 4-4 | Create Memory Viewer API | `V2 [API] - Memory Viewer Endpoints` | `✅ Completed` |
| | 4-5 | Create Test Case Registry API | `V2 [QA] - Test Case Registry Backend` | `✅ Completed` |
| **5: Frontend UI Impl.** | 5-1 | Build "The Brain Center" Hub | `V2 [UI] - The "Brain Center" Hub` | `✅ Completed` |
| | 5-2 | Build Brain Management Tab | `V2 [UI] - Brain Management Tab` | `✅ Completed` |
| | 5-3 | Build Memory Module Viewer Tab | `V2 [UI] - Memory Module Viewer Tab` | `✅ Completed` |
| | 5-4 | Implement Cognitive Inspector | `V2 [UI] - Cognitive Inspector` | `✅ Completed` |
| | 5-5 | Implement Universal Progress Indicator| `V2 [UI] - Universal Progress Indicator` | `✅ Completed` |
| | 5-6 | Implement Long Message Collapse | `V2 [UI] - Long Message Collapse Feature` | `✅ Completed` |
| **6: QA & Tooling** | 6-1 | Build Feature Health Dashboard | `V2 [UI] - Feature Health Dashboard UI` | `✅ Completed` |
| | 6-2 | Build Manual Test Execution UI | `V2 [UI] - Manual Test Execution UI` | `✅ Completed` |