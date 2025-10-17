
# SoulyCore: Frontend Architecture

**Document Version:** 2.0
**Status:** Current Implementation (Cognitive Architecture v2.0)

---

### 1. Component Breakdown

The frontend is structured using a modular component system in the `components/` directory.

*   **`App.tsx`**: The main client-side entry point orchestrating the entire UI. Manages layout, global context menu, and visibility of all major modals.

*   **`Sidebar.tsx`**: The primary navigation component, displaying conversations, providing search, and containing entry points to all major application hubs.

*   **`ChatWindow.tsx`**: The central view, responsible for rendering `Message` components, the `Header`, `ChatInput`, and `StatusBar`.

*   **`Header.tsx`**: A dedicated component at the top of the chat view displaying the conversation title and providing conversation-specific actions and global UI controls.

*   **`Message.tsx`**: Renders a single message. It handles markdown display, the `MessageToolbar` (copy, bookmark, etc.), and the new **Long Message Collapse** feature with automatic summarization.

*   **`ChatInput.tsx`**: The user input component. Manages text entry, image attachments, `@mention` autocomplete, and the launcher for the Prompts Hub.

*   **Hub & Center Modals (`ContactsHub.tsx`, `MemoryCenter.tsx`, `BrainCenter.tsx`, etc.)**: Each is a large, self-contained, and dynamically loaded component providing a full CRUD interface for a specific data model or system.

*   **V2 Cognitive UI Components**:
    *   **`BrainCenter.tsx`**: The main hub for managing the AI's cognitive architecture, with tabs for Brain configurations and a Memory Viewer.
    *   **`CognitiveInspectorModal.tsx`**: A modal that provides a "look behind the curtain" for a specific message turn, showing the context sent to the LLM and the knowledge extracted from it.
    *   **`UniversalProgressIndicator.tsx`**: A non-intrusive, top-of-page loading bar that indicates when background memory processing tasks are active.
    *   **`FeatureHealthDashboard.tsx`**: A new tab in the Dev Center for tracking the QA status of all application features.

### 2. State Management Strategy

The application uses the React Context API with a provider pattern for global state management.

*   **`AppProvider.tsx`**: The primary provider, serving as the client-side single source of truth for conversational and session data.
    *   **Responsibilities:** Manages state for `conversations`, `messages`, `settings`, etc. Contains all client-side logic for fetching and mutating data via API calls. Tracks global `isLoading`, `status`, and the new **`backgroundTaskCount`** for the universal progress indicator.

*   **`LogProvider.tsx`**: A dedicated provider for the developer log panel, managing log state and persistence.

### 3. Key UI Interaction Flow: Sending a Message (V2 Architecture)

The message-sending flow is now streamlined, with the frontend offloading complex logic to the backend's core engine.

1.  **User Input**: The user types a message in the `ChatInput` component.
2.  **Event Trigger**: `ChatInput` calls `onSendMessage` in `ChatWindow`.
3.  **Call to `AppProvider`**: `ChatWindow` calls the `addMessage` function from the `useAppContext` hook.
4.  **Optimistic UI Update**: `AppProvider` instantly adds the user's message to the local `messages` state to make it appear in the UI immediately.
5.  **Save User Message**: `AppProvider` makes a `POST` request to `/api/conversations/[id]/messages` to save the user's message to the database.
6.  **Call Core Chat Pipeline**: `AppProvider` makes a single, simplified `POST` request to `/api/chat`. The payload includes the message history and conversation object. **All complex context assembly now happens on the backend.**
7.  **Server-Side Orchestration**: The `/api/chat` endpoint invokes the `ContextAssemblyPipeline`, which queries all memory modules, builds the context, and calls the LLM.
8.  **Receive AI Response**: `AppProvider` receives the final AI response text from the API. The server has already handled saving this response to the database in the new V2 flow.
9.  **Final UI Update**: `AppProvider` simply re-fetches the messages for the conversation to get the latest state from the database, which now includes the AI's response. This ensures the UI is perfectly in sync with the persistent state.
10. **Trigger Memory Pipeline & Progress Indicator**: `AppProvider` calls `startBackgroundTask()` (incrementing `backgroundTaskCount`), which displays the `UniversalProgressIndicator`. It then makes an asynchronous `POST` request to `/api/memory/pipeline`. When the request finishes, it calls `endBackgroundTask()`.
