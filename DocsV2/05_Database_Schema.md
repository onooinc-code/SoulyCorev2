
# SoulyCore v2: Database Schema

**Document Version:** 2.0
**Status:** Live

---

### 1. Database Schema Overview

SoulyCore's structured and episodic memory is powered by a Vercel Postgres database. The schema is designed to store all data related to conversations, user-managed content, application configuration, and developer tooling. The tables are created and maintained by the script at `scripts/create-tables.js`.

### 2. Table Definitions

#### `conversations`
Stores the metadata for each individual chat session.

| Column                      | Type          | Description                                                    |
|-----------------------------|---------------|----------------------------------------------------------------|
| `id`                        | UUID (PK)     | Unique identifier for the conversation.                        |
| `title`                     | VARCHAR(255)  | The user-facing title of the chat.                             |
| `summary`                   | TEXT          | An AI-generated summary of the conversation.                   |
| `createdAt`                 | TIMESTAMPTZ   | Timestamp of when the conversation was created.                |
| `lastUpdatedAt`             | TIMESTAMPTZ   | Timestamp of the last message or update. Used for sorting.     |
| `systemPrompt`              | TEXT          | Custom system instructions for the AI for this conversation.   |
| `useSemanticMemory`         | BOOLEAN       | If true, the Context Assembly Pipeline will query Pinecone.    |
| `useStructuredMemory`       | BOOLEAN       | If true, the pipeline will query for entities.                 |
| `model`                     | VARCHAR(255)  | The specific AI model used for this conversation.              |
| `temperature`               | REAL          | The temperature setting for the model.                         |
| `topP`                      | REAL          | The top-p setting for the model.                               |
| `enableMemoryExtraction`    | BOOLEAN       | If true, the Memory Extraction Pipeline will run for this chat.|
| `enableProactiveSuggestions`| BOOLEAN       | If true, the AI will generate proactive suggestions.           |
| `enableAutoSummarization`   | BOOLEAN       | If true, long messages will be auto-summarized and collapsed.  |

---

#### `messages`
Stores every message exchanged within all conversations.

| Column          | Type        | Description                                                          |
|-----------------|-------------|----------------------------------------------------------------------|
| `id`            | UUID (PK)   | Unique identifier for the message.                                   |
| `conversationId`| UUID (FK)   | Foreign key to `conversations`. **Deletes cascade.**                 |
| `role`          | VARCHAR(50) | 'user' or 'model'.                                                   |
| `content`       | TEXT        | The text content of the message.                                     |
| `createdAt`     | TIMESTAMPTZ | Timestamp of when the message was created.                           |
| `tokenCount`    | INTEGER     | The estimated token count of the message content.                    |
| `responseTime`  | INTEGER     | For model messages, the generation time in milliseconds.             |
| `isBookmarked`  | BOOLEAN     | True if the user has bookmarked this message.                        |

---

#### `contacts`
Stores information about people and organizations.

| Column      | Type          | Description                             |
|-------------|---------------|-----------------------------------------|
| `id`        | UUID (PK)     | Unique identifier.                      |
| `name`      | VARCHAR(255)  | The contact's name.                     |
| `email`     | VARCHAR(255)  | The contact's email.                    |
| `company`   | VARCHAR(255)  | The contact's company.                  |
| `phone`     | VARCHAR(50)   | The contact's phone number.             |
| `notes`     | TEXT          | Freeform notes about the contact.       |
| `tags`      | TEXT[]        | An array of tags for categorization.    |
| `createdAt` | TIMESTAMPTZ   | Timestamp of creation.                  |

---

#### `entities`
Stores structured facts automatically extracted by the AI.

| Column         | Type         | Description                                     |
|----------------|--------------|-------------------------------------------------|
| `id`           | UUID (PK)    | Unique identifier.                              |
| `name`         | VARCHAR(255) | The name of the entity (e.g., "Project Titan"). |
| `type`         | VARCHAR(255) | The category of the entity (e.g., "Project").   |
| `details_json` | TEXT         | A JSON string containing other known attributes. |
| `createdAt`    | TIMESTAMPTZ  | Timestamp of creation.                          |

---

#### `prompts`
Stores reusable prompt templates for the Prompts Hub.

| Column             | Type        | Description                                                        |
|--------------------|-------------|--------------------------------------------------------------------|
| `id`               | UUID (PK)   | Unique identifier.                                                 |
| `name`             | VARCHAR(255)| The user-facing name of the prompt.                                |
| `content`          | TEXT        | The prompt text, which may contain `{{variable}}` placeholders.    |
| `folder`           | VARCHAR(255)| An optional folder for organization.                               |
| `tags`             | TEXT[]      | An array of tags for categorization.                               |
| `type`             | VARCHAR(50) | 'single' or 'chain' (for workflows).                               |
| `chain_definition` | JSONB       | For `chain` type, defines the steps and variable mappings.         |
| `createdAt`        | TIMESTAMPTZ | Timestamp of creation.                                             |
| `lastUpdatedAt`    | TIMESTAMPTZ | Timestamp of the last update.                                      |

---

#### `brains`
Stores high-level configurations for different AI Agent "Brains."

| Column        | Type          | Description                                                              |
|---------------|---------------|--------------------------------------------------------------------------|
| `id`          | UUID (PK)     | Unique identifier for the Brain.                                         |
| `name`        | VARCHAR(255)  | The unique, user-facing name of the Brain (e.g., "Work Brain").          |
| `config_json` | JSONB         | The JSON configuration defining the memory module namespaces for this Brain. |
| `createdAt`   | TIMESTAMPTZ   | Timestamp of when the Brain was created.                                 |

---

#### `pipeline_runs` & `pipeline_run_steps`
These tables log the execution of the backend cognitive pipelines for inspection and debugging.

- **`pipeline_runs`**: Stores a high-level record for each pipeline execution, linked to a `message_id`.
- **`pipeline_run_steps`**: Stores a detailed breakdown of each step within a single pipeline run, including inputs, outputs, timings, and any errors.

---

#### `features`, `feature_tests`, `api_endpoints`, `endpoint_test_logs`, `logs`, `settings`
These tables support the **SoulyDev Center** and general application configuration. Their schemas are detailed in the `scripts/create-tables.js` file.
