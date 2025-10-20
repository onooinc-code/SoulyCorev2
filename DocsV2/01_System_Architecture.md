# SoulyCore: Backend API Architecture

**Document Version:** 2.0
**Status:** Current Implementation (Cognitive Architecture v2.0)

---

### 1. API Endpoint Inventory

All backend logic is exposed through RESTful API endpoints built with Next.js API Routes. With the v2 refactor, these routes are now lightweight wrappers that delegate complex business logic to the **Core Services Layer**.

| Method | Path                                                 | Description                                                                 |
|--------|------------------------------------------------------|-----------------------------------------------------------------------------|
| POST   | `/api/chat`                                          | **Core endpoint.** Invokes the `ContextAssemblyPipeline` to generate an AI response. |
| POST   | `/api/memory/pipeline`                               | Asynchronously invokes the `MemoryExtractionPipeline` to learn from a conversation turn. |
| GET    | `/api/brains`                                        | **V2 New!** Fetches all Brain configurations. |
| POST   | `/api/brains`                                        | **V2 New!** Creates a new Brain configuration. |
| PUT    | `/api/brains/[brainId]`                              | **V2 New!** Updates a specific Brain. |
| DELETE | `/api/brains/[brainId]`                              | **V2 New!** Deletes a specific Brain. |
| GET    | `/api/memory-viewer/[module]`                        | **V2 New!** Inspects the raw data within a specified memory module. |
| GET    | `/api/inspect/[messageId]`                           | **V2 New!** Fetches the detailed pipeline execution log for a specific message turn. |
| GET    | `/api/tests`                                         | **V2 New!** Fetches all registered QA test cases. |
| POST   | `/api/tests`                                         | **V2 New!** Creates a new test case. |
| PUT    | `/api/tests/[testId]`                                | **V2 New!** Updates a test case, including its run status. |
| DELETE | `/api/tests/[testId]`                                | **V2 New!** Deletes a test case. |
| GET    | `/api/conversations`                                 | Fetches a list of all conversations.                                        |
| POST   | `/api/conversations`                                 | Creates a new conversation using default settings.                          |
| PUT    | `/api/conversations/[conversationId]`                | Updates a conversation's settings (title, system prompt, model config).     |
| GET    | `/api/conversations/[conversationId]/messages`       | Fetches all messages for a specific conversation.                           |
| POST   | `/api/conversations/[conversationId]/messages`       | Adds a new message to a conversation.                                       |
| (All other existing CRUD endpoints remain as before)           | ...                                                                         |

### 2. Deep Dive: `POST /api/chat` Logic Flow (V2 Architecture)

The `/api/chat` endpoint is now a lean orchestrator, delegating all heavy lifting to the Core Engine.

1.  **Request Parsing**: The endpoint receives a JSON body with `messages` (history) and the `conversation` object.
2.  **Instantiate Core Services**: It creates instances of the `ContextAssemblyPipeline` and the `EpisodicMemoryModule`.
3.  **Invoke Context Assembly**: It calls `contextPipeline.assembleContext(...)`, passing the necessary parameters like `conversationId`, `userQuery`, and `mentionedContacts`. The pipeline handles all communication with the various memory modules (Episodic, Semantic, Structured) to build a comprehensive context string.
4.  **Construct Final Prompt**: The context string returned by the pipeline is prepended to the user's latest message content.
5.  **Invoke LLM Provider**: The route calls the `llmProvider.generateContent(...)` method, passing the full history and the system instructions. The provider handles the direct communication with the Gemini API.
6.  **Persist AI Response**: Upon receiving the response text, the endpoint uses the `EpisodicMemoryModule` to store the AI's message in the database.
7.  **Generate Suggestion**: It may still make a secondary call to generate a proactive suggestion.
8.  **Response to Client**: The endpoint sends the final JSON response to the client, containing the AI's response text and any suggestion.

### 3. Deep Dive: `POST /api/memory/pipeline` Logic Flow (V2 Architecture)

This endpoint is now a fire-and-forget trigger for the backend memory extraction process.

1.  **Request Parsing**: The endpoint receives a JSON body containing the `textToAnalyze` (the user query and AI response combined).
2.  **Instantiate Pipeline**: It creates an instance of the `MemoryExtractionPipeline`.
3.  **Asynchronous Execution**: It calls `extractionPipeline.extractAndStore(...)` but does **not** `await` the result. This immediately frees up the server to respond to the client.
4.  **Immediate Response**: The endpoint immediately returns a `200 OK` response to the client, confirming that the memory processing has been initiated.
5.  **Background Processing**: The `MemoryExtractionPipeline` runs in the background, performing its LLM call to extract data and then calling the `store()` methods of the Semantic and Structured memory modules to persist the new knowledge. All errors are handled and logged within the pipeline itself.