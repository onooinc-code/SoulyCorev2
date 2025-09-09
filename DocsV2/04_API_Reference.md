
# SoulyCore v2: API Reference

**Document Version:** 2.0
**Status:** Live

---

### Core Cognitive Endpoints

| Method | Path                               | Description                                                              |
|--------|------------------------------------|--------------------------------------------------------------------------|
| `POST` | `/api/chat`                        | **Main endpoint.** Generates an AI response using the Context Assembly Pipeline. |
| `POST` | `/api/memory/pipeline`             | Asynchronously triggers the Memory Extraction Pipeline to learn from a conversation turn. |
| `GET`  | `/api/inspect/[messageId]`         | Fetches the detailed pipeline execution log for a specific message.      |

### Brain & Memory Management

| Method   | Path                          | Description                                                              |
|----------|-------------------------------|--------------------------------------------------------------------------|
| `GET`    | `/api/brains`                 | Fetches all Brain configurations.                                        |
| `POST`   | `/api/brains`                 | Creates a new Brain configuration.                                       |
| `PUT`    | `/api/brains/[brainId]`       | Updates a specific Brain.                                                |
| `DELETE` | `/api/brains/[brainId]`       | Deletes a specific Brain.                                                |
| `GET`    | `/api/memory-viewer/[module]` | Inspects the raw data within a memory module (e.g., `structured`, `episodic`). |

### Data Model CRUD Endpoints

#### Conversations
| Method   | Path                                           | Description                                                            |
|----------|------------------------------------------------|------------------------------------------------------------------------|
| `GET`    | `/api/conversations`                           | Fetches a list of all conversations.                                   |
| `POST`   | `/api/conversations`                           | Creates a new conversation with default settings.                      |
| `PUT`    | `/api/conversations/[conversationId]`          | Updates a conversation's settings (title, system prompt, model config).|
| `DELETE` | `/api/conversations/[conversationId]`          | Deletes a conversation and its messages.                               |
| `POST`   | `/api/conversations/[id]/generate-title`       | Generates and saves a new title for the conversation.                  |
| `POST`   | `/api/conversations/[id]/clear-messages`       | Deletes all messages within a conversation.                            |

#### Messages
| Method   | Path                                           | Description                                       |
|----------|------------------------------------------------|---------------------------------------------------|
| `GET`    | `/api/conversations/[conversationId]/messages` | Fetches all messages for a specific conversation. |
| `POST`   | `/api/conversations/[conversationId]/messages` | Adds a new message to a conversation.             |
| `PUT`    | `/api/messages/[messageId]`                    | Updates a message's content.                      |
| `DELETE` | `/api/messages/[messageId]`                    | Deletes a single message.                         |
| `PUT`    | `/api/messages/[messageId]/bookmark`           | Toggles the bookmark status of a message.         |
| `GET`    | `/api/bookmarks`                               | Fetches all bookmarked messages.                  |

#### Contacts
| Method   | Path                          | Description                  |
|----------|-------------------------------|------------------------------|
| `GET`    | `/api/contacts`               | Fetches all contacts.        |
| `POST`   | `/api/contacts`               | Creates a new contact.       |
| `PUT`    | `/api/contacts/[contactId]`   | Updates a specific contact.  |
| `DELETE` | `/api/contacts/[contactId]`   | Deletes a specific contact.  |

#### Entities (Structured Memory)
| Method   | Path                      | Description                |
|----------|---------------------------|----------------------------|
| `GET`    | `/api/entities`           | Fetches all entities.      |
| `POST`   | `/api/entities`           | Creates a new entity.      |
| `PUT`    | `/api/entities/[entityId]`| Updates a specific entity. |
| `DELETE` | `/api/entities/[entityId]`| Deletes a specific entity. |

#### Prompts
| Method   | Path                          | Description                                             |
|----------|-------------------------------|---------------------------------------------------------|
| `GET`    | `/api/prompts`                | Fetches all prompts.                                    |
| `POST`   | `/api/prompts`                | Creates a new prompt.                                   |
| `GET`    | `/api/prompts/[promptId]`     | Fetches a single prompt.                                |
| `PUT`    | `/api/prompts/[promptId]`     | Updates a specific prompt.                              |
| `DELETE` | `/api/prompts/[promptId]`     | Deletes a specific prompt.                              |

### Utility Endpoints

| Method | Path                       | Description                                |
|--------|----------------------------|--------------------------------------------|
| `POST` | `/api/summarize`           | Generates a summary for a block of text.   |
| `POST` | `/api/prompt/regenerate`   | Rewrites a user prompt based on history.   |
| `POST` | `/api/knowledge/add`       | Adds a new snippet to semantic memory.     |

### Developer Tooling Endpoints

| Method   | Path                                  | Description                                                            |
|----------|---------------------------------------|------------------------------------------------------------------------|
| `GET`    | `/api/features`                       | Fetches all feature definitions.                                       |
| `POST`   | `/api/features`                       | Creates a new feature definition.                                      |
| `PUT`    | `/api/features/[featureId]`           | Updates a feature definition.                                          |
| `DELETE` | `/api/features/[featureId]`           | Deletes a feature definition.                                          |
| `GET`    | `/api/tests`                          | Fetches all QA test cases.                                             |
| `POST`   | `/api/tests`                          | Creates a new test case.                                               |
| `PUT`    | `/api/tests/[testId]`                 | Updates a test case, including its status.                             |
| `DELETE` | `/api/tests/[testId]`                 | Deletes a test case.                                                   |
| `GET`    | `/api/settings`                       | Fetches global application settings.                                   |
| `PUT`    | `/api/settings`                       | Updates global application settings.                                   |
| `GET`    | `/api/logs/all`                       | Fetches all persistent logs.                                           |
| `POST`   | `/api/logs/create`                    | Creates a new log entry.                                               |
| `DELETE` | `/api/logs/all`                       | Deletes all log entries.                                               |
| `GET`    | `/api/api-endpoints`                  | Fetches all registered API endpoints for the Command Center.           |
| `POST`   | `/api/api-endpoints/test`             | Executes a single API endpoint test.                                   |
| `POST`   | `/api/api-endpoints/test-all`         | Executes a batch test run of all registered API endpoints.             |
| `GET`    | `/api/api-endpoints/test-logs/[id]`   | Fetches the recent test run history for a specific endpoint.           |
