
# SoulyCore: Data Model

**Document Version:** 2.0
**Status:** Current Implementation (Cognitive Architecture v2.0)

---

### 1. Database Schema Overview

SoulyCore's structured memory is powered by a Vercel Postgres database. The schema is designed to store all data related to conversations, user-managed content, application configuration, and developer tooling. The tables are created and maintained by the script at `scripts/create-tables.js`.

### 2. Table Definitions

#### `conversations`
Stores the metadata for each individual chat session.
*Fields: `id`, `agentId`, `title`, `summary`, `createdAt`, `lastUpdatedAt`, `systemPrompt`, `useSemanticMemory`, `useStructuredMemory`, `model`, `temperature`, `topP`*

#### `messages`
Stores every message exchanged within all conversations.
*Fields: `id`, `conversationId` (FK to `conversations`, ON DELETE CASCADE), `role`, `content`, `createdAt`, `tokenCount`, `responseTime`, `isBookmarked`*

#### `contacts`
Stores information about people, managed by the user in the Contacts Hub.
*Fields: `id`, `name`, `email`, `company`, `phone`, `notes`, `tags`, `createdAt`*

#### `entities`
Stores structured information (facts) automatically extracted by the AI from conversations.
*Fields: `id`, `name`, `type`, `details_json`, `createdAt`*

#### `features`
Stores the data for the Features Dictionary in the SoulyDev Center.
*Fields: `id`, `name`, `overview`, `status`, `ui_ux_breakdown_json`, `logic_flow`, `key_files_json`, `notes`*

#### `prompts`
Stores reusable prompt templates created in the Prompts Hub.
*Fields: `id`, `name`, `content`, `folder`, `tags`, `type` ('single' or 'chain'), `chain_definition` (JSONB for workflow steps)*

#### `logs`
A table for storing application logs for debugging purposes.
*Fields: `id`, `timestamp`, `message`, `payload`, `level`*

#### `settings`
A key-value store for global application configuration.
*Fields: `key` (PK), `value` (JSONB)*

---
### **New Tables in V2 Architecture**
---

#### `brains`
Stores the high-level configurations for different AI Agent "Brains."

| Column        | Type          | Description                                                              |
|---------------|---------------|--------------------------------------------------------------------------|
| `id`          | UUID (PK)     | Unique identifier for the Brain.                                         |
| `name`        | VARCHAR(255)  | The unique, user-facing name of the Brain (e.g., "Work Brain").          |
| `config_json` | JSONB         | The JSON configuration defining the memory module namespaces for this Brain. |
| `createdAt`   | TIMESTAMPTZ   | Timestamp of when the Brain was created.                                 |

#### `feature_tests`
Stores the test cases associated with features for the Feature Health Dashboard.

| Column            | Type        | Description                                                              |
|-------------------|-------------|--------------------------------------------------------------------------|
| `id`              | UUID (PK)   | Unique identifier for the test case.                                     |
| `featureId`       | UUID (FK)   | Foreign key linking to the `features` table. **Deletes cascade.**        |
| `description`     | TEXT        | A clear description of what the test case covers.                        |
| `manual_steps`    | TEXT        | A markdown-supported description of the steps to perform the test manually. |
| `expected_result` | TEXT        | A clear description of the expected outcome for a successful test.       |
| `last_run_status` | VARCHAR(50) | The status of the last test run: 'Passed', 'Failed', or 'Not Run'.       |
| `last_run_at`     | TIMESTAMPTZ | Timestamp of when the test was last run.                                 |
| `createdAt`       | TIMESTAMPTZ | Timestamp of when the test case was created.                             |

#### `pipeline_runs`
Logs a high-level record for each execution of a major cognitive pipeline.

| Column          | Type        | Description                                                              |
|-----------------|-------------|--------------------------------------------------------------------------|
| `id`            | UUID (PK)   | Unique identifier for the run.                                           |
| `message_id`    | UUID (FK)   | Foreign key to the `messages` table, linking a run to a specific message turn. |
| `pipeline_type` | VARCHAR(50) | The type of pipeline, e.g., 'ContextAssembly' or 'MemoryExtraction'.      |
| `status`        | VARCHAR(50) | The final status: 'running', 'completed', or 'failed'.                   |
| `final_output`  | TEXT        | The final assembled context string or a summary of extracted data.       |
| `start_time`    | TIMESTAMPTZ | The start time of the pipeline execution.                                |
| `end_time`      | TIMESTAMPTZ | The end time of the pipeline execution.                                  |
| `duration_ms`   | INTEGER     | The total execution time in milliseconds.                                |

#### `pipeline_run_steps`
Logs the detailed, individual steps within a single `pipeline_runs` execution.

| Column           | Type        | Description                                                              |
|------------------|-------------|--------------------------------------------------------------------------|
| `id`             | UUID (PK)   | Unique identifier for the step.                                          |
| `run_id`         | UUID (FK)   | Foreign key to the `pipeline_runs` table. **Deletes cascade.**           |
| `step_order`     | INTEGER     | The sequence number of this step in the pipeline.                        |
| `step_name`      | VARCHAR(255)| The name of the step, e.g., 'QuerySemanticMemory'.                       |
| `status`         | VARCHAR(50) | The status of the step: 'completed' or 'failed'.                         |
| `input_payload`  | JSONB       | The input data provided to this step.                                    |
| `output_payload` | JSONB       | The data returned by this step.                                          |
| `model_used`     | VARCHAR(255)| The AI model used for this step, if any.                                 |
| `prompt_used`    | TEXT        | The full prompt sent to the AI model, if any.                            |
| `config_used`    | JSONB       | The configuration object used for the AI model call, if any.             |
| `error_message`  | TEXT        | Any error message if the step failed.                                    |
| `duration_ms`    | INTEGER     | The execution time of this specific step in milliseconds.                |